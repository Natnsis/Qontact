package com.example.linksy

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.ParcelUuid
import android.os.SystemClock
import org.json.JSONObject
import java.security.SecureRandom
import java.util.UUID

/**
 * Peer-to-peer card exchange over Bluetooth LE. Every phone that is searching
 * advertises and scans at the same time, and runs a small GATT server.
 *
 * Discovery: the advertised service UUID is a fixed Linksy prefix plus a
 * 4-byte session id, so a hardware scan filter (prefix + mask) wakes us only
 * for Linksy phones. The scan response carries the person's name, so they
 * appear on the radar without a connection.
 *
 * Exchange (one connection, high priority, MTU 517):
 *   sender   -> REQ  write   {s: session, n: name}       "wants to share"
 *   receiver -> RESP notify  {ok, card}                  accept / decline
 *   sender   -> CARD write   {s: session, card}          after acceptance
 * Notifications are framed (1 flag byte: 1 = more, 0 = last) so any MTU works;
 * long writes use the platform's prepared writes.
 *
 * All callbacks are funnelled onto the main thread; events go to Dart via [emit].
 */
@SuppressLint("MissingPermission") // Permissions are checked in MainActivity before any call.
class LinksyBle(private val context: Context, private val emit: (Map<String, Any?>) -> Unit) {

    companion object {
        private const val ADV_PREFIX = "4c494e4b-5359-4100-8000-0000"
        private val ADV_MASK = ParcelUuid.fromString("ffffffff-ffff-ffff-ffff-ffff00000000")
        private val SERVICE = UUID.fromString("4c494e4b-5359-4200-8000-000000000001")
        private val REQ = UUID.fromString("4c494e4b-5359-4200-8000-000000000002")
        private val RESP = UUID.fromString("4c494e4b-5359-4200-8000-000000000003")
        private val CARD = UUID.fromString("4c494e4b-5359-4200-8000-000000000004")
        private val CCCD = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")
        private const val MANUFACTURER_ID = 0xFFFF
        private const val NAME_BYTES = 24
        private const val LOST_AFTER_MS = 8000L
        private const val RSSI_EMIT_MS = 250L
    }

    private val main = Handler(Looper.getMainLooper())
    private val manager = context.getSystemService(BluetoothManager::class.java)
    private val adapter: BluetoothAdapter? get() = manager?.adapter

    /** This phone's id for the whole app run, as 8 hex chars. */
    val session: String = ByteArray(4).also { SecureRandom().nextBytes(it) }
        .joinToString("") { "%02x".format(it) }

    private var myName = ""
    private var running = false

    val isOn: Boolean get() = adapter?.isEnabled == true

    // ---------------------------------------------------------------- adapter state

    private val stateReceiver = object : BroadcastReceiver() {
        override fun onReceive(c: Context, intent: Intent) {
            val state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR)
            when (state) {
                BluetoothAdapter.STATE_ON -> emit(mapOf("type" to "bt", "on" to true))
                BluetoothAdapter.STATE_TURNING_OFF, BluetoothAdapter.STATE_OFF -> {
                    teardown()
                    emit(mapOf("type" to "bt", "on" to false))
                }
            }
        }
    }

    init {
        context.registerReceiver(stateReceiver, IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED))
    }

    fun dispose() {
        teardown()
        try {
            context.unregisterReceiver(stateReceiver)
        } catch (_: Exception) {
        }
    }

    /** Turns Bluetooth on directly where Android allows it (below 13). */
    @Suppress("DEPRECATION")
    fun enableDirect(): Boolean = Build.VERSION.SDK_INT < 33 && adapter?.enable() == true

    /** Turns Bluetooth off directly where Android allows it (below 13). */
    @Suppress("DEPRECATION")
    fun disableDirect(): Boolean = Build.VERSION.SDK_INT < 33 && adapter?.disable() == true

    // ---------------------------------------------------------------- start / stop

    /** Starts the GATT server, advertising and scanning. Returns an error or null. */
    fun start(name: String): String? {
        val a = adapter ?: return "No Bluetooth on this phone"
        if (!a.isEnabled) return "Bluetooth is off"
        myName = name
        if (running) return null
        running = true
        startScan()
        openServer() // advertising starts once the service is registered
        main.post(sweep)
        return null
    }

    /** Stops radio activity and closes all connections. */
    fun stop() = teardown()

    private fun teardown() {
        running = false
        main.removeCallbacks(sweep)
        stopScan()
        stopAdvertising()
        outbound?.close()
        outbound = null
        try {
            server?.close()
        } catch (_: Exception) {
        }
        server = null
        respChar = null
        inbound.clear()
        serverMtu.clear()
        prepared.clear()
        notifyQueue.clear()
        peers.clear()
    }

    // ---------------------------------------------------------------- advertising

    private var advertising = false

    private val advCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
            advertising = true
        }

        override fun onStartFailure(errorCode: Int) {
            advertising = false
            if (errorCode != ADVERTISE_FAILED_ALREADY_STARTED) {
                emit(mapOf("type" to "error", "message" to "Couldn't make this phone visible ($errorCode)"))
            }
        }
    }

    private fun startAdvertising() {
        val adv = adapter?.bluetoothLeAdvertiser ?: return emit(
            mapOf("type" to "error", "message" to "This phone can't be visible over Bluetooth"),
        )
        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY) // ~100 ms interval
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(true)
            .setTimeout(0)
            .build()
        val data = AdvertiseData.Builder()
            .addServiceUuid(ParcelUuid.fromString(ADV_PREFIX + session))
            .setIncludeDeviceName(false)
            .setIncludeTxPowerLevel(false)
            .build()
        val response = AdvertiseData.Builder()
            .addManufacturerData(MANUFACTURER_ID, utf8Truncate(myName, NAME_BYTES))
            .setIncludeDeviceName(false)
            .build()
        try {
            adv.startAdvertising(settings, data, response, advCallback)
        } catch (e: Exception) {
            emit(mapOf("type" to "error", "message" to (e.message ?: "Advertising failed")))
        }
    }

    private fun stopAdvertising() {
        if (!advertising) return
        advertising = false
        try {
            adapter?.bluetoothLeAdvertiser?.stopAdvertising(advCallback)
        } catch (_: Exception) {
        }
    }

    // ---------------------------------------------------------------- scanning

    private class Peer(var device: BluetoothDevice, var name: String, var rssi: Double) {
        var lastSeen = SystemClock.elapsedRealtime()
        var lastEmit = 0L
    }

    private val peers = HashMap<String, Peer>()
    private var scanning = false

    /** Android silently returns nothing after 5 scan starts in 30 s; never exceed it. */
    private val scanStarts = ArrayDeque<Long>()

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            main.post { onResult(result) }
        }

        override fun onBatchScanResults(results: MutableList<ScanResult>) {
            main.post { results.forEach { onResult(it) } }
        }

        override fun onScanFailed(errorCode: Int) {
            main.post {
                scanning = false
                if (errorCode == SCAN_FAILED_ALREADY_STARTED) return@post
                // Usually registration throttling: retry shortly rather than miss peers.
                if (running) main.postDelayed({ if (running) startScan() }, 1500)
            }
        }
    }

    private fun startScan() {
        if (scanning) return
        val scanner = adapter?.bluetoothLeScanner ?: return
        val now = SystemClock.elapsedRealtime()
        while (scanStarts.isNotEmpty() && now - scanStarts.first() > 30_000) scanStarts.removeFirst()
        if (scanStarts.size >= 5) {
            main.postDelayed({ if (running) startScan() }, 30_000 - (now - scanStarts.first()) + 50)
            return
        }
        val filter = ScanFilter.Builder()
            .setServiceUuid(ParcelUuid.fromString(ADV_PREFIX + "00000000"), ADV_MASK)
            .build()
        val settings = ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            .setReportDelay(0)
            .setCallbackType(ScanSettings.CALLBACK_TYPE_ALL_MATCHES)
            .setMatchMode(ScanSettings.MATCH_MODE_AGGRESSIVE)
            .setNumOfMatches(ScanSettings.MATCH_NUM_MAX_ADVERTISEMENT)
            .build()
        try {
            scanner.startScan(listOf(filter), settings, scanCallback)
            scanning = true
            scanStarts.addLast(now)
        } catch (e: Exception) {
            emit(mapOf("type" to "error", "message" to (e.message ?: "Scan failed")))
        }
    }

    private fun stopScan() {
        if (!scanning) return
        scanning = false
        try {
            adapter?.bluetoothLeScanner?.stopScan(scanCallback)
        } catch (_: Exception) {
        }
    }

    private fun onResult(result: ScanResult) {
        if (!running) return
        val record = result.scanRecord ?: return
        val uuid = record.serviceUuids?.firstOrNull { it.toString().startsWith(ADV_PREFIX) } ?: return
        val id = uuid.toString().substring(ADV_PREFIX.length)
        if (id == session) return
        // Android scan response: manufacturer data. iOS advertises a local name instead.
        val name = record.getManufacturerSpecificData(MANUFACTURER_ID)?.let { String(it, Charsets.UTF_8) }
            ?: record.deviceName ?: ""
        val now = SystemClock.elapsedRealtime()
        val p = peers[id]
        if (p == null) {
            val peer = Peer(result.device, name, result.rssi.toDouble())
            peers[id] = peer
            sendPeer(id, peer, now)
            return
        }
        p.device = result.device
        p.lastSeen = now
        p.rssi = p.rssi * 0.7 + result.rssi * 0.3 // smooth out RSSI jitter
        val renamed = name.isNotEmpty() && name != p.name
        if (renamed) p.name = name
        if (renamed || now - p.lastEmit >= RSSI_EMIT_MS) sendPeer(id, p, now)
    }

    private fun sendPeer(id: String, p: Peer, now: Long) {
        p.lastEmit = now
        emit(mapOf("type" to "peer", "id" to id, "name" to p.name, "rssi" to p.rssi))
    }

    private val sweep = object : Runnable {
        override fun run() {
            if (!running) return
            val now = SystemClock.elapsedRealtime()
            val gone = peers.filterValues { now - it.lastSeen > LOST_AFTER_MS }.keys
            for (id in gone) {
                peers.remove(id)
                emit(mapOf("type" to "lost", "id" to id))
            }
            main.postDelayed(this, 1000)
        }
    }

    // ---------------------------------------------------------------- GATT server (receiver side)

    private var server: BluetoothGattServer? = null
    private var respChar: BluetoothGattCharacteristic? = null

    /** Session id -> device that sent us a request. */
    private val inbound = HashMap<String, BluetoothDevice>()
    private val serverMtu = HashMap<String, Int>()
    private val prepared = HashMap<String, ByteArray>()
    private val notifyQueue = HashMap<String, ArrayDeque<ByteArray>>()

    private fun openServer() {
        val gattServer = manager?.openGattServer(context, serverCallback) ?: return emit(
            mapOf("type" to "error", "message" to "Couldn't start Bluetooth exchange"),
        )
        server = gattServer
        val service = BluetoothGattService(SERVICE, BluetoothGattService.SERVICE_TYPE_PRIMARY)
        service.addCharacteristic(
            BluetoothGattCharacteristic(
                REQ,
                BluetoothGattCharacteristic.PROPERTY_WRITE,
                BluetoothGattCharacteristic.PERMISSION_WRITE,
            ),
        )
        val resp = BluetoothGattCharacteristic(
            RESP,
            BluetoothGattCharacteristic.PROPERTY_NOTIFY,
            BluetoothGattCharacteristic.PERMISSION_READ,
        )
        resp.addDescriptor(
            BluetoothGattDescriptor(
                CCCD,
                BluetoothGattDescriptor.PERMISSION_READ or BluetoothGattDescriptor.PERMISSION_WRITE,
            ),
        )
        service.addCharacteristic(resp)
        service.addCharacteristic(
            BluetoothGattCharacteristic(
                CARD,
                BluetoothGattCharacteristic.PROPERTY_WRITE,
                BluetoothGattCharacteristic.PERMISSION_WRITE,
            ),
        )
        respChar = resp
        gattServer.addService(service)
    }

    private val serverCallback = object : BluetoothGattServerCallback() {
        override fun onServiceAdded(status: Int, service: BluetoothGattService) {
            main.post { if (running && status == BluetoothGatt.GATT_SUCCESS) startAdvertising() }
        }

        override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
            if (newState != BluetoothProfile.STATE_DISCONNECTED) return
            main.post {
                serverMtu.remove(device.address)
                notifyQueue.remove(device.address)
                prepared.keys.removeAll { it.startsWith(device.address) }
            }
        }

        override fun onMtuChanged(device: BluetoothDevice, mtu: Int) {
            main.post { serverMtu[device.address] = mtu }
        }

        override fun onCharacteristicWriteRequest(
            device: BluetoothDevice,
            requestId: Int,
            characteristic: BluetoothGattCharacteristic,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray?,
        ) {
            val bytes = value ?: ByteArray(0)
            if (responseNeeded) server?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, bytes)
            val uuid = characteristic.uuid
            main.post {
                if (preparedWrite) {
                    val key = device.address + uuid
                    val buf = prepared[key] ?: ByteArray(0)
                    val merged = if (buf.size >= offset + bytes.size) buf else buf.copyOf(offset + bytes.size)
                    System.arraycopy(bytes, 0, merged, offset, bytes.size)
                    prepared[key] = merged
                } else {
                    onWrite(device, uuid, bytes)
                }
            }
        }

        override fun onExecuteWrite(device: BluetoothDevice, requestId: Int, execute: Boolean) {
            server?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null)
            main.post {
                val keys = prepared.keys.filter { it.startsWith(device.address) }
                for (key in keys) {
                    val bytes = prepared.remove(key) ?: continue
                    if (execute) onWrite(device, UUID.fromString(key.substring(device.address.length)), bytes)
                }
            }
        }

        override fun onDescriptorWriteRequest(
            device: BluetoothDevice,
            requestId: Int,
            descriptor: BluetoothGattDescriptor,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray?,
        ) {
            if (responseNeeded) server?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, value)
        }

        override fun onNotificationSent(device: BluetoothDevice, status: Int) {
            main.post { sendNextFrame(device) }
        }
    }

    private fun onWrite(device: BluetoothDevice, uuid: UUID, bytes: ByteArray) {
        val json = try {
            JSONObject(String(bytes, Charsets.UTF_8))
        } catch (_: Exception) {
            return
        }
        val id = json.optString("s").takeIf { it.isNotEmpty() } ?: return
        when (uuid) {
            REQ -> {
                inbound[id] = device
                emit(mapOf("type" to "incoming", "id" to id, "name" to json.optString("n")))
            }
            CARD -> emit(mapOf("type" to "card", "id" to id, "card" to cardMap(json.optJSONObject("card"))))
        }
    }

    /** Answers a request: sends our card on accept, or a decline. */
    fun respond(id: String, accept: Boolean, card: Map<String, String>?): Boolean {
        val device = inbound[id] ?: return false
        val payload = JSONObject().put("ok", accept)
        if (accept && card != null) payload.put("card", JSONObject(card as Map<*, *>))
        val bytes = payload.toString().toByteArray(Charsets.UTF_8)
        val chunk = (serverMtu[device.address] ?: 23) - 3 - 1
        val frames = ArrayDeque<ByteArray>()
        var i = 0
        while (i < bytes.size || frames.isEmpty()) {
            val end = minOf(bytes.size, i + chunk)
            val more: Byte = if (end < bytes.size) 1 else 0
            frames.addLast(byteArrayOf(more) + bytes.copyOfRange(i, end))
            i = end
        }
        notifyQueue[device.address] = frames
        sendNextFrame(device)
        if (!accept) inbound.remove(id)
        return true
    }

    private fun sendNextFrame(device: BluetoothDevice) {
        val frames = notifyQueue[device.address] ?: return
        val frame = frames.removeFirstOrNull() ?: return run { notifyQueue.remove(device.address) }
        val ch = respChar ?: return
        val s = server ?: return
        if (Build.VERSION.SDK_INT >= 33) {
            s.notifyCharacteristicChanged(device, ch, false, frame)
        } else {
            @Suppress("DEPRECATION")
            ch.value = frame
            @Suppress("DEPRECATION")
            s.notifyCharacteristicChanged(device, ch, false)
        }
    }

    // ---------------------------------------------------------------- GATT client (sender side)

    private var outbound: Outbound? = null

    /** Connects to a peer and asks to share. Progress arrives as events. */
    fun request(id: String): Boolean {
        val peer = peers[id] ?: return false
        outbound?.close()
        stopScan() // a busy radio slows connection setup; we already know who to talk to
        outbound = Outbound(id, peer.device).also { it.connect() }
        return true
    }

    /** After the peer accepted: sends our card over the open connection. */
    fun sendCard(id: String, card: Map<String, String>): Boolean {
        val out = outbound?.takeIf { it.id == id } ?: return false
        return out.writeCard(card)
    }

    /** Drops an outgoing request (cancel / timeout). */
    fun cancel(id: String) {
        if (outbound?.id == id) {
            outbound?.close()
            outbound = null
        }
        if (running) startScan()
    }

    private inner class Outbound(val id: String, val device: BluetoothDevice) {
        private var gatt: BluetoothGatt? = null
        private var attempts = 0
        private var mtu = 23
        private var discovered = false
        private val incoming = java.io.ByteArrayOutputStream()
        private var closed = false

        fun connect() {
            attempts++
            gatt = if (Build.VERSION.SDK_INT >= 26) {
                device.connectGatt(
                    context, false, callback, BluetoothDevice.TRANSPORT_LE,
                    BluetoothDevice.PHY_LE_1M_MASK or BluetoothDevice.PHY_LE_2M_MASK,
                )
            } else {
                device.connectGatt(context, false, callback, BluetoothDevice.TRANSPORT_LE)
            }
        }

        fun close() {
            closed = true
            try {
                gatt?.disconnect()
                gatt?.close()
            } catch (_: Exception) {
            }
            gatt = null
        }

        private fun fail(message: String) {
            if (closed) return
            close()
            if (outbound === this) outbound = null
            emit(mapOf("type" to "failed", "id" to id, "message" to message))
            if (running) startScan()
        }

        private fun discover() {
            if (discovered || closed) return
            discovered = true
            gatt?.discoverServices()
        }

        private fun write(uuid: UUID, json: JSONObject): Boolean {
            val g = gatt ?: return false
            val ch = g.getService(SERVICE)?.getCharacteristic(uuid) ?: return false
            val bytes = json.toString().toByteArray(Charsets.UTF_8)
            return if (Build.VERSION.SDK_INT >= 33) {
                g.writeCharacteristic(ch, bytes, BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT) ==
                    BluetoothGatt.GATT_SUCCESS
            } else {
                @Suppress("DEPRECATION")
                ch.value = bytes
                ch.writeType = BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT
                @Suppress("DEPRECATION")
                g.writeCharacteristic(ch)
            }
        }

        fun writeCard(card: Map<String, String>): Boolean =
            write(CARD, JSONObject().put("s", session).put("card", JSONObject(card as Map<*, *>)))

        private fun onFrame(frame: ByteArray) {
            if (frame.isEmpty()) return
            incoming.write(frame, 1, frame.size - 1)
            if (frame[0].toInt() != 0) return
            val json = try {
                JSONObject(incoming.toString(Charsets.UTF_8.name()))
            } catch (_: Exception) {
                return fail("Bad reply")
            }
            incoming.reset()
            emit(
                mapOf(
                    "type" to "response",
                    "id" to id,
                    "ok" to json.optBoolean("ok"),
                    "card" to cardMap(json.optJSONObject("card")),
                ),
            )
            if (!json.optBoolean("ok")) {
                close()
                if (outbound === this) outbound = null
                if (running) startScan()
            }
        }

        val callback = object : BluetoothGattCallback() {
            override fun onConnectionStateChange(g: BluetoothGatt, status: Int, newState: Int) {
                main.post {
                    if (closed) return@post
                    if (newState == BluetoothProfile.STATE_CONNECTED && status == BluetoothGatt.GATT_SUCCESS) {
                        g.requestConnectionPriority(BluetoothGatt.CONNECTION_PRIORITY_HIGH)
                        if (!g.requestMtu(517)) discover()
                        // Some stacks never report the MTU change; don't wait on them.
                        main.postDelayed({ discover() }, 600)
                    } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                        try {
                            g.close()
                        } catch (_: Exception) {
                        }
                        // 133 and friends are often transient: retry once, immediately.
                        if (attempts < 2 && !discovered) connect() else fail("Connection lost")
                    }
                }
            }

            override fun onMtuChanged(g: BluetoothGatt, newMtu: Int, status: Int) {
                main.post {
                    if (status == BluetoothGatt.GATT_SUCCESS) mtu = newMtu
                    discover()
                }
            }

            override fun onServicesDiscovered(g: BluetoothGatt, status: Int) {
                main.post {
                    if (closed) return@post
                    val resp = g.getService(SERVICE)?.getCharacteristic(RESP)
                        ?: return@post fail("Not a Linksy phone")
                    g.setCharacteristicNotification(resp, true)
                    val cccd = resp.getDescriptor(CCCD) ?: return@post fail("Not a Linksy phone")
                    val ok = if (Build.VERSION.SDK_INT >= 33) {
                        g.writeDescriptor(cccd, BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE) ==
                            BluetoothGatt.GATT_SUCCESS
                    } else {
                        @Suppress("DEPRECATION")
                        cccd.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
                        @Suppress("DEPRECATION")
                        g.writeDescriptor(cccd)
                    }
                    if (!ok) fail("Couldn't subscribe")
                }
            }

            override fun onDescriptorWrite(g: BluetoothGatt, d: BluetoothGattDescriptor, status: Int) {
                main.post {
                    if (closed) return@post
                    if (status != BluetoothGatt.GATT_SUCCESS) return@post fail("Couldn't subscribe")
                    if (!write(REQ, JSONObject().put("s", session).put("n", myName))) fail("Couldn't send request")
                }
            }

            override fun onCharacteristicWrite(g: BluetoothGatt, ch: BluetoothGattCharacteristic, status: Int) {
                main.post {
                    if (closed) return@post
                    if (status != BluetoothGatt.GATT_SUCCESS) return@post fail("Send failed")
                    when (ch.uuid) {
                        REQ -> emit(mapOf("type" to "sent", "id" to id))
                        CARD -> {
                            emit(mapOf("type" to "delivered", "id" to id))
                            close()
                            if (outbound === this@Outbound) outbound = null
                        }
                    }
                }
            }

            override fun onCharacteristicChanged(
                g: BluetoothGatt,
                ch: BluetoothGattCharacteristic,
                value: ByteArray,
            ) {
                val copy = value.copyOf()
                main.post { if (!closed && ch.uuid == RESP) onFrame(copy) }
            }

            @Deprecated("Deprecated in Java")
            override fun onCharacteristicChanged(g: BluetoothGatt, ch: BluetoothGattCharacteristic) {
                if (Build.VERSION.SDK_INT >= 33) return
                @Suppress("DEPRECATION")
                val copy = ch.value?.copyOf() ?: return
                main.post { if (!closed && ch.uuid == RESP) onFrame(copy) }
            }
        }
    }

    // ---------------------------------------------------------------- helpers

    private fun cardMap(json: JSONObject?): Map<String, String>? {
        json ?: return null
        val out = HashMap<String, String>()
        for (key in json.keys()) json.optString(key).takeIf { it.isNotEmpty() }?.let { out[key] = it }
        return out
    }

    /** UTF-8 bytes of [s], cut at a character boundary to at most [max] bytes. */
    private fun utf8Truncate(s: String, max: Int): ByteArray {
        var bytes = s.toByteArray(Charsets.UTF_8)
        var end = s.length
        while (bytes.size > max && end > 0) {
            end--
            bytes = s.substring(0, end).toByteArray(Charsets.UTF_8)
        }
        return bytes
    }
}
