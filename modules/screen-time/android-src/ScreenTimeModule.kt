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

    // ── Exact package names to always exclude ─────────────────────
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

    // ── Package name PREFIXES — entire namespace is system infra ──
    private val EXCLUDED_PREFIXES = listOf(
        "android.",                       // android.process.media, android.process.acore …
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

    // ── Display-name words that mean it's a system process ────────
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

            // Exact midnight → now
            val cal = Calendar.getInstance()
            val endTime   = cal.timeInMillis
            cal.set(Calendar.HOUR_OF_DAY, 0)
            cal.set(Calendar.MINUTE, 0)
            cal.set(Calendar.SECOND, 0)
            cal.set(Calendar.MILLISECOND, 0)
            val startTime = cal.timeInMillis

            val pm          = reactApplicationContext.packageManager
            val ownPackage  = reactApplicationContext.packageName

            // ── INTERVAL_DAILY: one clean, non-overlapping bucket per app ──
            // This is what Digital Wellbeing uses. Unlike INTERVAL_BEST which
            // returns multiple overlapping hourly/daily/weekly buckets (causing
            // double-counting), INTERVAL_DAILY with a same-day window gives
            // exactly today's foreground time per app.
            // We keep the MAX value per package in case the OS returns more
            // than one entry for the same package on the same day.
            val stats = usm.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY, startTime, endTime
            )

            // Deduplicate: keep max totalTimeInForeground per package
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

            // ── Inclusion test ─────────────────────────────────────────────
            fun shouldInclude(pkg: String, ms: Long): Boolean {
                if (pkg == ownPackage) return false
                if (ms < 1_000L) return false
                if (EXCLUDED_PACKAGES.contains(pkg)) return false
                if (EXCLUDED_PREFIXES.any { pkg.startsWith(it) }) return false
                // Resolve display label and check against keyword list
                val label = try {
                    pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0))
                        .toString().trim().lowercase()
                } catch (_: Exception) { return false }
                if (EXCLUDED_NAME_KEYWORDS.contains(label)) return false
                // Drop invisible background-only system apps
                if (isInvisibleSystemApp(pm, pkg)) return false
                return true
            }

            // Total = ALL qualifying apps (matches Digital Wellbeing's total)
            val totalMs = timeMap.entries
                .filter { (pkg, ms) -> shouldInclude(pkg, ms) }
                .sumOf { it.value }

            // Top 20 for the list
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

    // Returns true for system apps that have no user-visible launcher icon
    // (background services, framework processes, etc.)
    private fun isInvisibleSystemApp(pm: PackageManager, pkg: String): Boolean {
        return try {
            val flags = pm.getApplicationInfo(pkg, 0).flags
            val isSystem = (flags and ApplicationInfo.FLAG_SYSTEM) != 0
            if (!isSystem) return false          // user-installed → always keep
            pm.getLaunchIntentForPackage(pkg) == null   // no icon → exclude
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

