package com.example.linksy

import android.Manifest
import android.app.Activity
import android.bluetooth.BluetoothAdapter
import android.content.ContentProviderOperation
import android.content.ContentUris
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioManager
import android.media.ToneGenerator
import android.net.Uri
import android.os.Build
import android.provider.ContactsContract
import android.provider.Settings
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import com.google.android.gms.auth.api.identity.GetPhoneNumberHintIntentRequest
import com.google.android.gms.auth.api.identity.Identity
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodChannel

/**
 * Reads the user's own details from the device for card setup:
 *  - phoneNumberHint: Google's Phone Number Hint picker (no permission needed)
 *  - simNumbers: numbers stored on the SIM cards (READ_PHONE_NUMBERS)
 *  - ownerProfile: the device owner's "Me" contact (READ_CONTACTS)
 *  - pickContact: a contact the user picks, e.g. their own card (READ_CONTACTS)
 *  - saveContact / deleteContact: received cards, silently (no prompt, no redirect)
 *  - contactsPermission, openAppSettings, openLocationSettings
 *
 * "linksy/ble" drives [LinksyBle]; its events stream on "linksy/ble/events".
 */
class MainActivity : FlutterActivity() {
    private var pending: MethodChannel.Result? = null
    private var afterPermission: (() -> Unit)? = null
    private var events: EventChannel.EventSink? = null
    private var ble: LinksyBle? = null

    override fun onDestroy() {
        ble?.dispose()
        ble = null
        super.onDestroy()
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "linksy/device")
            .setMethodCallHandler { call, result ->
                if (pending != null) {
                    result.error("busy", "Another request is in progress", null)
                    return@setMethodCallHandler
                }
                when (call.method) {
                    "phoneNumberHint" -> phoneNumberHint(result)
                    "simNumbers" -> withPermission(phonePermission(), result) {
                        result.success(readSimNumbers())
                    }
                    "ownerProfile" -> withPermission(Manifest.permission.READ_CONTACTS, result) {
                        result.success(readProfile())
                    }
                    "pickContact" -> withPermission(Manifest.permission.READ_CONTACTS, result) {
                        pending = result
                        val intent = Intent(Intent.ACTION_PICK, ContactsContract.Contacts.CONTENT_URI)
                        @Suppress("DEPRECATION")
                        startActivityForResult(intent, REQ_PICK)
                    }
                    // Saving never prompts: access is asked for once, up front.
                    "saveContact" -> {
                        if (!granted(Manifest.permission.WRITE_CONTACTS)) {
                            return@setMethodCallHandler result.error("denied", "No Contacts access", null)
                        }
                        @Suppress("UNCHECKED_CAST")
                        result.success(saveContact(call.arguments as Map<String, String>))
                    }
                    "contactsPermission" -> withPermissions(
                        arrayOf(Manifest.permission.READ_CONTACTS, Manifest.permission.WRITE_CONTACTS),
                        result,
                    ) { result.success(true) }
                    "hasContactsPermission" -> result.success(granted(Manifest.permission.WRITE_CONTACTS))
                    "openAppSettings" -> {
                        startActivity(
                            Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", packageName, null)),
                        )
                        result.success(true)
                    }
                    // Short, quiet two-note chime on the notification volume (silent in silent mode).
                    "chime" -> {
                        val tone = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 70)
                        tone.startTone(ToneGenerator.TONE_PROP_ACK, 220)
                        android.os.Handler(mainLooper).postDelayed({ tone.release() }, 400)
                        result.success(true)
                    }
                    "openLocationSettings" -> {
                        startActivity(Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS))
                        result.success(true)
                    }
                    "deleteContact" -> {
                        if (!granted(Manifest.permission.WRITE_CONTACTS)) return@setMethodCallHandler result.success(false)
                        val id = (call.arguments as Number).toLong()
                        val uri = ContentUris.withAppendedId(ContactsContract.RawContacts.CONTENT_URI, id)
                        result.success(contentResolver.delete(uri, null, null) > 0)
                    }
                    else -> result.notImplemented()
                }
            }

        val engine = LinksyBle(applicationContext) { event -> events?.success(event) }
        ble = engine
        EventChannel(flutterEngine.dartExecutor.binaryMessenger, "linksy/ble/events")
            .setStreamHandler(object : EventChannel.StreamHandler {
                override fun onListen(arguments: Any?, sink: EventChannel.EventSink) {
                    events = sink
                }

                override fun onCancel(arguments: Any?) {
                    events = null
                }
            })
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "linksy/ble")
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "isOn" -> result.success(engine.isOn)
                    "permissions" -> withPermissions(blePermissions(), result) { result.success(true) }
                    "enable" -> {
                        if (engine.isOn || engine.enableDirect()) return@setMethodCallHandler result.success(true)
                        if (pending != null) return@setMethodCallHandler result.error("busy", null, null)
                        withPermissions(blePermissions(), result) {
                            pending = result
                            @Suppress("DEPRECATION")
                            startActivityForResult(Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE), REQ_ENABLE)
                        }
                    }
                    "disable" -> {
                        // Android 13+ doesn't let apps switch Bluetooth off: open its settings.
                        if (!engine.disableDirect()) startActivity(Intent(Settings.ACTION_BLUETOOTH_SETTINGS))
                        result.success(true)
                    }
                    "start" -> withPermissions(blePermissions(), result) {
                        // Android 11 and below return no scan results while Location is off.
                        if (Build.VERSION.SDK_INT < 31 && !locationOn()) {
                            return@withPermissions result.error("location", "Turn on Location to find nearby phones", null)
                        }
                        val error = engine.start(call.argument<String>("name") ?: "")
                        if (error == null) result.success(engine.session) else result.error("start", error, null)
                    }
                    "stop" -> {
                        engine.stop()
                        result.success(null)
                    }
                    "request" -> result.success(engine.request(call.argument<String>("id")!!))
                    "respond" -> result.success(
                        engine.respond(
                            call.argument<String>("id")!!,
                            call.argument<Boolean>("accept") == true,
                            call.argument<Map<String, String>>("card"),
                        ),
                    )
                    "sendCard" -> result.success(
                        engine.sendCard(call.argument<String>("id")!!, call.argument<Map<String, String>>("card")!!),
                    )
                    "cancel" -> {
                        engine.cancel(call.argument<String>("id")!!)
                        result.success(null)
                    }
                    else -> result.notImplemented()
                }
            }
    }

    private fun blePermissions(): Array<String> =
        if (Build.VERSION.SDK_INT >= 31) {
            arrayOf(
                Manifest.permission.BLUETOOTH_SCAN,
                Manifest.permission.BLUETOOTH_ADVERTISE,
                Manifest.permission.BLUETOOTH_CONNECT,
            )
        } else {
            arrayOf(Manifest.permission.ACCESS_FINE_LOCATION)
        }

    // ---- Permissions ----

    private fun phonePermission() =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) Manifest.permission.READ_PHONE_NUMBERS
        else Manifest.permission.READ_PHONE_STATE

    private fun granted(permission: String) = checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED

    private fun locationOn(): Boolean {
        val lm = getSystemService(Context.LOCATION_SERVICE) as android.location.LocationManager
        return if (Build.VERSION.SDK_INT >= 28) lm.isLocationEnabled
        else lm.isProviderEnabled(android.location.LocationManager.GPS_PROVIDER) ||
            lm.isProviderEnabled(android.location.LocationManager.NETWORK_PROVIDER)
    }

    private fun withPermission(permission: String, result: MethodChannel.Result, run: () -> Unit) =
        withPermissions(arrayOf(permission), result, run)

    private fun withPermissions(permissions: Array<String>, result: MethodChannel.Result, run: () -> Unit) {
        val missing = permissions.filter { checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED }
        if (missing.isEmpty()) return run()
        pending = result
        afterPermission = run
        requestPermissions(missing.toTypedArray(), REQ_PERMISSION)
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != REQ_PERMISSION) return
        val result = pending
        val run = afterPermission
        pending = null
        afterPermission = null
        val ok = grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }
        if (ok) {
            run?.invoke()
            return
        }
        // Denied with "don't ask again" (or twice): Android won't show the dialog anymore.
        val blocked = permissions.indices.any {
            grantResults[it] != PackageManager.PERMISSION_GRANTED && !shouldShowRequestPermissionRationale(permissions[it])
        }
        result?.error(if (blocked) "blocked" else "denied", "Permission denied", null)
    }

    // ---- Phone Number Hint ----

    private fun phoneNumberHint(result: MethodChannel.Result) {
        val request = GetPhoneNumberHintIntentRequest.builder().build()
        Identity.getSignInClient(this).getPhoneNumberHintIntent(request)
            .addOnSuccessListener { pendingIntent ->
                pending = result
                try {
                    @Suppress("DEPRECATION")
                    startIntentSenderForResult(pendingIntent.intentSender, REQ_HINT, null, 0, 0, 0)
                } catch (e: Exception) {
                    pending = null
                    result.error("unavailable", e.message, null)
                }
            }
            .addOnFailureListener { e -> result.error("unavailable", e.message, null) }
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        @Suppress("DEPRECATION")
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != REQ_HINT && requestCode != REQ_PICK && requestCode != REQ_ENABLE) return
        val result = pending ?: return
        pending = null
        if (requestCode == REQ_ENABLE) return result.success(resultCode == Activity.RESULT_OK)
        if (resultCode != Activity.RESULT_OK || data == null) return result.success(null)

        if (requestCode == REQ_HINT) {
            val number = try {
                Identity.getSignInClient(this).getPhoneNumberFromIntent(data)
            } catch (e: Exception) {
                null
            }
            result.success(number)
        } else {
            val id = data.data?.let { contactId(it) }
            result.success(id?.let { readContact(it) })
        }
    }

    // ---- SIM numbers ----

    private fun readSimNumbers(): List<String> {
        val sm = getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
            ?: return emptyList()
        val subs = try {
            sm.activeSubscriptionInfoList
        } catch (e: SecurityException) {
            null
        } ?: return emptyList()
        return subs.mapNotNull { readNumber(it.subscriptionId, sm) }.distinct()
    }

    // line1Number is unreliable on modern Android - many carriers leave it blank.
    // Prefer the SubscriptionManager APIs and fall back to it on older devices.
    private fun readNumber(subId: Int, sm: SubscriptionManager): String? {
        if (Build.VERSION.SDK_INT >= 33) {
            try {
                sm.getPhoneNumber(subId).trim().takeIf { it.isNotBlank() }?.let { return it }
            } catch (e: Exception) {
                // fall through to legacy lookup
            }
        }
        return try {
            @Suppress("DEPRECATION")
            (getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager)
                .createForSubscriptionId(subId).line1Number?.trim()?.takeIf { it.isNotBlank() }
        } catch (e: Exception) {
            null
        }
    }

    // ---- Contacts ----

    private fun contactId(uri: Uri): Long? =
        contentResolver.query(uri, arrayOf(ContactsContract.Contacts._ID), null, null, null)?.use {
            if (it.moveToFirst()) it.getLong(0) else null
        }

    private fun readProfile(): Map<String, String>? {
        val uri = Uri.withAppendedPath(
            ContactsContract.Profile.CONTENT_URI,
            ContactsContract.Contacts.Data.CONTENT_DIRECTORY,
        )
        return readData(uri, null, null)
    }

    private fun readContact(id: Long): Map<String, String>? = readData(
        ContactsContract.Data.CONTENT_URI,
        "${ContactsContract.Data.CONTACT_ID} = ?",
        arrayOf(id.toString()),
    )

    /** Collects name, phone, email, company and title from contact data rows. */
    private fun readData(uri: Uri, selection: String?, args: Array<String>?): Map<String, String>? {
        val out = mutableMapOf<String, String>()
        val projection = arrayOf(
            ContactsContract.Data.MIMETYPE,
            ContactsContract.Data.DATA1,
            ContactsContract.Data.DATA4,
            ContactsContract.Data.IS_PRIMARY,
        )
        try {
            contentResolver.query(uri, projection, selection, args, null)?.use { c ->
                while (c.moveToNext()) {
                    val type = c.getString(0) ?: continue
                    val d1 = c.getString(1)?.trim().orEmpty()
                    val d4 = c.getString(2)?.trim().orEmpty()
                    val primary = c.getInt(3) != 0
                    fun put(key: String, value: String) {
                        if (value.isNotEmpty() && (primary || key !in out)) out[key] = value
                    }
                    when (type) {
                        ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE -> put("name", d1)
                        ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE -> put("phone", d1)
                        ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE -> put("email", d1)
                        ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE -> {
                            put("company", d1)
                            put("title", d4)
                        }
                    }
                }
            }
        } catch (e: SecurityException) {
            return null
        }
        return out.ifEmpty { null }
    }

    /** Inserts a received card as a new contact; returns its raw contact id. */
    private fun saveContact(card: Map<String, String>): Long? {
        val ops = arrayListOf(
            ContentProviderOperation.newInsert(ContactsContract.RawContacts.CONTENT_URI)
                .withValue(ContactsContract.RawContacts.ACCOUNT_TYPE, null)
                .withValue(ContactsContract.RawContacts.ACCOUNT_NAME, null)
                .build(),
        )
        fun row(mime: String, vararg values: Pair<String, Any?>) {
            val op = ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
                .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
                .withValue(ContactsContract.Data.MIMETYPE, mime)
            for ((k, v) in values) op.withValue(k, v)
            ops.add(op.build())
        }
        card["name"]?.let {
            row(ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE,
                ContactsContract.CommonDataKinds.StructuredName.DISPLAY_NAME to it)
        }
        card["phone"]?.let {
            row(ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE,
                ContactsContract.CommonDataKinds.Phone.NUMBER to it,
                ContactsContract.CommonDataKinds.Phone.TYPE to ContactsContract.CommonDataKinds.Phone.TYPE_MOBILE)
        }
        card["email"]?.let {
            row(ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE,
                ContactsContract.CommonDataKinds.Email.ADDRESS to it,
                ContactsContract.CommonDataKinds.Email.TYPE to ContactsContract.CommonDataKinds.Email.TYPE_WORK)
        }
        if (card["company"] != null || card["title"] != null) {
            row(ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE,
                ContactsContract.CommonDataKinds.Organization.COMPANY to card["company"],
                ContactsContract.CommonDataKinds.Organization.TITLE to card["title"])
        }
        return try {
            val res = contentResolver.applyBatch(ContactsContract.AUTHORITY, ops)
            res.firstOrNull()?.uri?.let { ContentUris.parseId(it) }
        } catch (e: Exception) {
            null
        }
    }

    companion object {
        private const val REQ_ENABLE = 4104
        private const val REQ_HINT = 4101
        private const val REQ_PICK = 4102
        private const val REQ_PERMISSION = 4103
    }
}
