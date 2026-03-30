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

    // Exact packages to always exclude
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

    // Entire package namespaces that are system infrastructure
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

    // Display-name keywords that mean it is a system process
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

            // Today: midnight → now
            val cal = Calendar.getInstance()
            val endTime = cal.timeInMillis
            cal.set(Calendar.HOUR_OF_DAY, 0)
            cal.set(Calendar.MINUTE, 0)
            cal.set(Calendar.SECOND, 0)
            cal.set(Calendar.MILLISECOND, 0)
            val startTime = cal.timeInMillis   // exact midnight

            val pm = reactApplicationContext.packageManager
            val ownPackage = reactApplicationContext.packageName

            // ── queryEvents with pre-midnight buffer ──────────────────────────
            // We start the query 4 hours before midnight so that apps which were
            // already in the foreground at midnight are captured. Each session is
            // then CLIPPED to [startTime, endTime] so only today's foreground
            // time is counted. This is the only approach that:
            //   (a) doesn't double-count like INTERVAL_BEST, and
            //   (b) doesn't miss cross-midnight sessions like a plain midnight query.
            val PRE_MIDNIGHT_BUFFER = 4L * 60 * 60 * 1000   // 4 hours in ms
            val queryStart = startTime - PRE_MIDNIGHT_BUFFER

            val events = usm.queryEvents(queryStart, endTime)
            val event = UsageEvents.Event()

            // pkg → timestamp of the most recent RESUMED event
            val resumeMap = mutableMapOf<String, Long>()
            // pkg → accumulated foreground ms for today
            val timeMap = mutableMapOf<String, Long>()
            // pkg → last time the app was used today
            val lastMap = mutableMapOf<String, Long>()

            while (events.hasNextEvent()) {
                events.getNextEvent(event)
                val pkg = event.packageName

                when (event.eventType) {
                    UsageEvents.Event.ACTIVITY_RESUMED -> {
                        resumeMap[pkg] = event.timeStamp
                    }
                    UsageEvents.Event.ACTIVITY_PAUSED,
                    UsageEvents.Event.ACTIVITY_STOPPED -> {
                        val resumeAt = resumeMap.remove(pkg)
                        if (resumeAt != null) {
                            // Clip to today: only count time AFTER midnight
                            val sessionStart = maxOf(resumeAt, startTime)
                            val sessionEnd = minOf(event.timeStamp, endTime)
                            val duration = sessionEnd - sessionStart
                            if (duration > 0L) {
                                timeMap[pkg] = (timeMap[pkg] ?: 0L) + duration
                                val prevLast = lastMap[pkg] ?: 0L
                                if (sessionEnd > prevLast) lastMap[pkg] = sessionEnd
                            }
                        }
                    }
                }
            }

            // Apps still in foreground right now — add elapsed time since resume
            resumeMap.forEach { (pkg, resumeAt) ->
                val sessionStart = maxOf(resumeAt, startTime)
                val duration = endTime - sessionStart
                if (duration > 0L) {
                    timeMap[pkg] = (timeMap[pkg] ?: 0L) + duration
                    lastMap[pkg] = endTime
                }
            }

            // ── Inclusion filter ─────────────────────────────────────────────
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

            // Total across ALL qualifying apps
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

    // System apps without a launcher icon are invisible background services — exclude them.
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
