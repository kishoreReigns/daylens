package com.daylens.ai.screentime

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import android.os.Process
import android.provider.Settings
import com.facebook.react.bridge.*
import java.util.Calendar

class ScreenTimeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "ScreenTime"

    @ReactMethod
    fun hasPermission(promise: Promise) {
        promise.resolve(checkUsagePermission())
    }

    @ReactMethod
    fun openPermissionSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactApplicationContext.startActivity(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getUsageStats(promise: Promise) {
        try {
            if (!checkUsagePermission()) {
                promise.resolve(Arguments.createMap().apply {
                    putBoolean("permitted", false)
                    putDouble("totalTodayMs", 0.0)
                    putArray("apps", Arguments.createArray())
                })
                return
            }

            val usm = reactApplicationContext
                .getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

            val cal = Calendar.getInstance()
            val endTime = cal.timeInMillis
            cal.set(Calendar.HOUR_OF_DAY, 0)
            cal.set(Calendar.MINUTE, 0)
            cal.set(Calendar.SECOND, 0)
            cal.set(Calendar.MILLISECOND, 0)
            val startTime = cal.timeInMillis

            val stats = usm.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY, startTime, endTime
            )

            val pm = reactApplicationContext.packageManager
            // Aggregate duplicate entries per package
            val timeMap = mutableMapOf<String, Long>()
            val lastMap = mutableMapOf<String, Long>()

            stats?.forEach { s ->
                if (s.totalTimeInForeground > 30_000L) {
                    timeMap[s.packageName] =
                        (timeMap[s.packageName] ?: 0L) + s.totalTimeInForeground
                    if (s.lastTimeUsed > (lastMap[s.packageName] ?: 0L)) {
                        lastMap[s.packageName] = s.lastTimeUsed
                    }
                }
            }

            val appsArray = Arguments.createArray()
            var totalMs = 0L

            timeMap.entries
                .sortedByDescending { it.value }
                .take(20)
                .forEach { (pkg, ms) ->
                    totalMs += ms
                    val appName = try {
                        pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
                    } catch (_: PackageManager.NameNotFoundException) {
                        pkg.substringAfterLast('.')
                    }
                    val isSystem = try {
                        (pm.getApplicationInfo(pkg, 0).flags and ApplicationInfo.FLAG_SYSTEM) != 0
                    } catch (_: Exception) {
                        false
                    }
                    appsArray.pushMap(Arguments.createMap().apply {
                        putString("packageName", pkg)
                        putString("appName", appName)
                        putDouble("totalTimeMs", ms.toDouble())
                        putDouble("lastUsed", (lastMap[pkg] ?: 0L).toDouble())
                        putBoolean("isSystemApp", isSystem)
                    })
                }

            promise.resolve(Arguments.createMap().apply {
                putBoolean("permitted", true)
                putDouble("totalTodayMs", totalMs.toDouble())
                putArray("apps", appsArray)
            })
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    private fun checkUsagePermission(): Boolean {
        return try {
            val am = reactApplicationContext
                .getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                am.unsafeCheckOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(),
                    reactApplicationContext.packageName
                )
            } else {
                @Suppress("DEPRECATION")
                am.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(),
                    reactApplicationContext.packageName
                )
            }
            mode == AppOpsManager.MODE_ALLOWED
        } catch (_: Exception) {
            false
        }
    }
}
