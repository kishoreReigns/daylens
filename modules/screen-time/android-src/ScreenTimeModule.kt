package com.daylens.ai.screentime

import android.app.AppOpsManager
import android.app.usage.UsageEvents
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

    // Packages to always exclude — system infrastructure that inflates time
    private val EXCLUDED_PACKAGES = setOf(
        "android",
        "com.android.systemui",
        "com.android.launcher",
        "com.android.launcher2",
        "com.android.launcher3",
        "com.google.android.launcher",
        "com.sec.android.app.launcher",          // Samsung
        "com.miui.home",                          // Xiaomi
        "com.huawei.android.launcher",           // Huawei
        "com.oppo.launcher",                      // Oppo
        "com.vivo.launcher",                      // Vivo
        "com.oneplus.launcher",                   // OnePlus
        "com.android.phone",
        "com.android.incallui",
        "com.android.server.telecom",
        "com.android.inputmethod.latin",
        "com.google.android.inputmethod.latin",
        "com.samsung.android.honeyboard",
        "com.android.settings",
        "com.android.packageinstaller",
        "com.google.android.packageinstaller",
        "com.android.vending",                    // Play Store itself
    )

    // App display names to exclude regardless of package name
    private val EXCLUDED_NAMES = setOf(
        "android", "android os", "android system",
        "system ui", "systemui", "launcher",
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

            // Exact midnight → now for today only
            val cal = Calendar.getInstance()
            val endTime = cal.timeInMillis
            cal.set(Calendar.HOUR_OF_DAY, 0)
            cal.set(Calendar.MINUTE, 0)
            cal.set(Calendar.SECOND, 0)
            cal.set(Calendar.MILLISECOND, 0)
            val startTime = cal.timeInMillis

            val pm = reactApplicationContext.packageManager
            val ownPackage = reactApplicationContext.packageName

            // ── Use queryEvents for accurate foreground time ──────────────
            // This is exactly how Digital Wellbeing computes usage — by
            // pairing ACTIVITY_RESUMED → ACTIVITY_PAUSED events per app.
            // queryUsageStats(INTERVAL_BEST) double-counts overlapping hourly
            // buckets, producing inflated totals.
            val events = usm.queryEvents(startTime, endTime)
            val event  = UsageEvents.Event()

            // pkg → timestamp of last RESUMED event
            val resumeMap = mutableMapOf<String, Long>()
            // pkg → accumulated foreground ms
            val timeMap   = mutableMapOf<String, Long>()

            while (events.hasNextEvent()) {
                events.getNextEvent(event)
                val pkg = event.packageName

                when (event.eventType) {
                    UsageEvents.Event.ACTIVITY_RESUMED -> {
                        resumeMap[pkg] = event.timeStamp
                    }
                    UsageEvents.Event.ACTIVITY_PAUSED,
                    UsageEvents.Event.ACTIVITY_STOPPED -> {
                        val start = resumeMap.remove(pkg)
                        if (start != null) {
                            val duration = event.timeStamp - start
                            if (duration > 0L) {
                                timeMap[pkg] = (timeMap[pkg] ?: 0L) + duration
                            }
                        }
                    }
                }
            }

            // Apps still in foreground at query time — add elapsed time
            resumeMap.forEach { (pkg, start) ->
                val duration = endTime - start
                if (duration > 0L) {
                    timeMap[pkg] = (timeMap[pkg] ?: 0L) + duration
                }
            }

            // ── Filter helper ──────────────────────────────────────────────
            fun shouldInclude(pkg: String, ms: Long): Boolean {
                if (pkg == ownPackage) return false
                if (EXCLUDED_PACKAGES.contains(pkg)) return false
                if (ms < 1_000L) return false
                if (isSystemInfraPackage(pm, pkg)) return false
                // Also filter by resolved display name
                val label = try {
                    pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0))
                        .toString().trim().lowercase()
                } catch (_: Exception) { "" }
                if (EXCLUDED_NAMES.contains(label)) return false
                return true
            }

            // ── Total = ALL qualifying apps (not just top 20) ──────────────
            val totalMs = timeMap.entries
                .filter { (pkg, ms) -> shouldInclude(pkg, ms) }
                .sumOf { it.value }

            // ── Top 20 apps for the list ───────────────────────────────────
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
                        putDouble("lastUsed", endTime.toDouble())
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

    /**
     * Returns true for packages that are pure OS/infrastructure — no visible UI.
     * We keep system apps that the user actually launches (e.g. Gallery, Camera).
     */
    private fun isSystemInfraPackage(pm: PackageManager, pkg: String): Boolean {
        val infraPrefixes = listOf(
            "com.android.server",
            "com.android.providers",
            "com.android.bluetooth",
            "com.android.nfc",
            "com.android.wifi",
            "com.android.networklocation",
            "com.google.android.gms",
            "com.google.android.gsf",
            "com.google.android.syncadapters",
            "com.samsung.android.app.watchmanagershared",
            "com.samsung.android.bixby",
            "com.samsung.android.knox",
        )
        if (infraPrefixes.any { pkg.startsWith(it) }) return true

        return try {
            val flags = pm.getApplicationInfo(pkg, 0).flags
            val isSystem = (flags and ApplicationInfo.FLAG_SYSTEM) != 0
            if (!isSystem) return false
            // Keep system apps that have a launcher icon (user-visible)
            val hasLauncher = pm.getLaunchIntentForPackage(pkg) != null
            !hasLauncher
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

class ScreenTimeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "ScreenTime"

    // Packages to always exclude — system infrastructure that inflates time
    private val EXCLUDED_PACKAGES = setOf(
        "android",
        "com.android.systemui",
        "com.android.launcher",
        "com.android.launcher2",
        "com.android.launcher3",
        "com.google.android.launcher",
        "com.sec.android.app.launcher",          // Samsung
        "com.miui.home",                          // Xiaomi
        "com.huawei.android.launcher",           // Huawei
        "com.oppo.launcher",                      // Oppo
        "com.vivo.launcher",                      // Vivo
        "com.oneplus.launcher",                   // OnePlus
        "com.android.phone",
        "com.android.incallui",
        "com.android.server.telecom",
        "com.android.inputmethod.latin",
        "com.google.android.inputmethod.latin",
        "com.samsung.android.honeyboard",
        "com.android.settings",
        "com.android.packageinstaller",
        "com.google.android.packageinstaller",
        "com.android.vending",                    // Play Store itself
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

            // Exact midnight → now for today only
            val cal = Calendar.getInstance()
            val endTime = cal.timeInMillis
            cal.set(Calendar.HOUR_OF_DAY, 0)
            cal.set(Calendar.MINUTE, 0)
            cal.set(Calendar.SECOND, 0)
            cal.set(Calendar.MILLISECOND, 0)
            val startTime = cal.timeInMillis

            // INTERVAL_BEST gives the most fine-grained data for the requested window
            val stats = usm.queryUsageStats(
                UsageStatsManager.INTERVAL_BEST, startTime, endTime
            )

            val pm = reactApplicationContext.packageManager
            val ownPackage = reactApplicationContext.packageName

            // Aggregate per package
            val timeMap = mutableMapOf<String, Long>()
            val lastMap = mutableMapOf<String, Long>()

            stats?.forEach { s ->
                val pkg = s.packageName
                // Skip our own app, excluded list, and entries < 1 second
                if (pkg == ownPackage) return@forEach
                if (EXCLUDED_PACKAGES.contains(pkg)) return@forEach
                if (s.totalTimeInForeground < 1_000L) return@forEach

                // Skip pure system infrastructure packages
                if (isSystemInfraPackage(pm, pkg)) return@forEach

                timeMap[pkg] = (timeMap[pkg] ?: 0L) + s.totalTimeInForeground
                if (s.lastTimeUsed > (lastMap[pkg] ?: 0L)) {
                    lastMap[pkg] = s.lastTimeUsed
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

    /**
     * Returns true for packages that are pure OS/infrastructure — no visible UI.
     * We keep system apps that the user actually launches (e.g. Gallery, Camera).
     */
    private fun isSystemInfraPackage(pm: PackageManager, pkg: String): Boolean {
        // Filter known Android system infrastructure prefixes
        val infraPrefixes = listOf(
            "com.android.server",
            "com.android.providers",
            "com.android.bluetooth",
            "com.android.nfc",
            "com.android.wifi",
            "com.android.networklocation",
            "com.google.android.gms",             // GMS background services (very high time)
            "com.google.android.gsf",
            "com.google.android.syncadapters",
        )
        if (infraPrefixes.any { pkg.startsWith(it) }) return true

        // Also skip if not installed / no launcher intent and is system
        return try {
            val flags = pm.getApplicationInfo(pkg, 0).flags
            val isSystem = (flags and ApplicationInfo.FLAG_SYSTEM) != 0
            if (!isSystem) return false
            // Keep system apps that have a launcher icon (user-visible)
            val hasLauncher = pm.getLaunchIntentForPackage(pkg) != null
            !hasLauncher
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

