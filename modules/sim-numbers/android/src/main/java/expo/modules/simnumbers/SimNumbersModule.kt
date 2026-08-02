package expo.modules.simnumbers

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SimNumbersModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("SimNumbers")

    AsyncFunction("getSimNumbers") {
      return@AsyncFunction readSimNumbers()
    }
  }

  private fun readSimNumbers(): List<Map<String, Any?>> {
    val hasPermission = ContextCompat.checkSelfPermission(
      context,
      Manifest.permission.READ_PHONE_NUMBERS
    ) == PackageManager.PERMISSION_GRANTED

    if (!hasPermission) {
      return emptyList()
    }

    val subscriptionManager =
      context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
        ?: return emptyList()

    val subscriptions = try {
      subscriptionManager.activeSubscriptionInfoList
    } catch (e: SecurityException) {
      null
    } ?: return emptyList()

    return subscriptions.mapIndexed { index, info ->
      val number = readLine1Number(info.subscriptionId)
      val carrierName = info.carrierName?.toString()?.takeIf { it.isNotBlank() }
        ?: info.displayName?.toString()?.takeIf { it.isNotBlank() }
        ?: "SIM ${index + 1}"

      mapOf(
        "slotIndex" to info.simSlotIndex,
        "carrierName" to carrierName,
        "number" to number
      )
    }
  }

  private fun readLine1Number(subscriptionId: Int): String? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return null
    }

    return try {
      val telephonyManager =
        context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
      telephonyManager.createForSubscriptionId(subscriptionId)?.line1Number
        ?.trim()
        ?.takeIf { it.isNotBlank() }
    } catch (e: SecurityException) {
      null
    } catch (e: Exception) {
      null
    }
  }
}
