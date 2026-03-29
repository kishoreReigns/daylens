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

    private val EXCLUDED_PACKAGES = setOf(
        "android",
        "com.android.systemui",
        "com.android.launcher",
        "com.android.launcher2",
        "com.android.launcher3",
        "com.google.android.launcher",
        "com.sec.android.app.launcher",
        "com.miui.home",
        "com.huawei.android.launcher",
        "com.oppo.launcher",
        "com.vivo.launcher",
        "com.oneplus.launcher",
        "com.android.phone",
        "com.android.incallui",
        "com.android.server.telecom",
        "com.android.inputmethod.latin",
        "com.google.android.inputmethod.latin",
        "com.samsung.android.honeyboard",
        "com.android.settings",
        "com.android.packageinstaller",
        "com.google.android.packageinstaller",
        "com.android.vending",
    )

    private val EXCLUDED_PREFIXES = listOf(
        "android.",
        "com.android.server",
        "com.android.providers",
        "com.android.bluetooth",
        "com.android.nfc",
        "com.android.wifi",
        "com.android.networklocation",
        "com.google.android.gms",
        "com.google.android.gsf",
        "com.google.android.syncadapters",
        "com.samsung.android.bixby",
        "com.samsung.android.knox",
    )

    private val EXCLUDED_NAME_KEYWORDS = setOf(
        "android", "android os", "android system",
        "system ui", "systemui",
        "phone", "dialer", "keyboard",
    )

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

            val pm = reactApplicationContext.packageManager
            val ownPackage = reactApplicationContext.packageName

            val stats = usm.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY, startTime, endTime
            )

            val timeMap = mutableMapOf<String, Long>()
            val lastMap = mutableMapOf<String, Long>()

            stats?.forEach { s ->
                val ms = s.totalTimeInForeground
                if (ms > 0L) {
                    val prev = timeMap[s.packageName] ?: 0L
                    if (ms > prev) timeMap[s.packageName] = ms
                    val prevLast = lastMap[s.packageName] ?: 0L
                    if (s.lastTimeUsed > prevLast) lastMap[s.packageName] = s.lastTimeUsed
                }
            }

            fun shouldInclude(pkg: String, ms: Long): Boolean {
                if (pkg == ownPackage) return false
                if (ms < 1_000L) return false
                if (EXCLUDED_PACKAGES.contains(pkg)) return false
                if (EXCLUDED_PREFIXES.any { pkg.startsWith(it) }) return false
                val label = try {
                    pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0))
                        .toString().trim().lowercase()
                } catch (_: Exception) { return false }
                if (EXCLUDED_NAME_KEYWORDS.contains(label)) return false
                if (isInvisibleSystemApp(pm, pkg)) return false
                return true
            }

            val totalMs = timeMap.entries
                .filter { (pkg, ms) -> shouldInclude(pkg, ms) }
                .sumOf { it.value }

            val appsArray = Arguments.createArray()
            timeMap.entries
                .filter { (pkg, ms) -> shouldInclude(pkg, ms) }
                .sortedByDescending { it.value }
                .take(20)
                .forEach { (pkg, ms) ->
                    val appName = try {
                        pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
                    } catch (_: PackageManager.NameNotFoundException) {
                        pkg.substringAfterLast('.')
                    }
                    val isSystem = try {
                        (pm.getApplicationInfo(pkg, 0).flags and ApplicationInfo.FLAG_SYSTEM) != 0
                    } catch (_: Exception) { false }

                    appsArray.pushMap(Arguments.createMap().apply {
                        putString("packageName", pkg)
                        putString("appName", appName)
                        putDouble("totalTimeMs", ms.toDouble())
                        putDouble("lastUsed", (lastMap[pkg] ?: endTime).toDouble())
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

    private fun isInvisibleSystemApp(pm: PackageManager, pkg: String): Boolean {
        return try {
            val flags = pm.getApplicationInfo(pkg, 0).flags
            val isSystem = (flags and ApplicationInfo.FLAG_SYSTEM) != 0
            if (!isSystem) return false
            pm.getLaunchIntentForPackage(pkg) == null
        } catch (_: Exception) {
            false
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
