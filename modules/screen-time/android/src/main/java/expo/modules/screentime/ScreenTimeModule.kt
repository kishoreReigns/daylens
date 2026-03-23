// ─────────────────────────────────────────────────────────────────────────────
//  ScreenTimeModule.kt
//  Reads Android UsageStatsManager — returns per-app foreground time for today.
//
//  Requires: android.permission.PACKAGE_USAGE_STATS
//  This is a "special" permission — user must grant it via Settings > Usage Access.
//  It is NOT a standard danger permission (can't request via dialog).
// ─────────────────────────────────────────────────────────────────────────────
package expo.modules.screentime

import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.util.Calendar

// ── Return records (mapped to JS objects) ────────────────────────────────────
class AppUsageRecord : Record {
  @Field var packageName: String = ""
  @Field var appName:     String = ""
  @Field var totalTimeMs: Double = 0.0   // ms as Double (JS Number)
  @Field var lastUsed:    Double = 0.0   // unix timestamp ms
  @Field var isSystemApp: Boolean = false
}

class ScreenTimeResultRecord : Record {
  @Field var permitted:    Boolean          = false
  @Field var totalTodayMs: Double           = 0.0
  @Field var apps:         List<AppUsageRecord> = emptyList()
}

// ── Module definition ─────────────────────────────────────────────────────────
class ScreenTimeModule : Module() {
  override fun definition() = ModuleDefinition {

    Name("ScreenTime")

    // ── hasPermission ─────────────────────────
    AsyncFunction("hasPermission") {
      checkPermission()
    }

    // ── openPermissionSettings ────────────────
    AsyncFunction("openPermissionSettings") {
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      appContext.reactContext?.startActivity(intent)
    }

    // ── getUsageStats ─────────────────────────
    AsyncFunction("getUsageStats") {
      val ctx = appContext.reactContext
        ?: return@AsyncFunction ScreenTimeResultRecord()

      val result = ScreenTimeResultRecord()

      if (!checkPermission()) {
        result.permitted = false
        return@AsyncFunction result
      }

      result.permitted = true

      // Time range: midnight today → now
      val cal = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
      }
      val startMs = cal.timeInMillis
      val endMs   = System.currentTimeMillis()

      val usm = ctx.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
        ?: return@AsyncFunction result

      val stats = usm.queryUsageStats(
        UsageStatsManager.INTERVAL_DAILY, startMs, endMs
      ) ?: return@AsyncFunction result

      val pm = ctx.packageManager
      // Group by package (queryUsageStats can return duplicates)
      val grouped = mutableMapOf<String, Long>()
      val lastUsedMap = mutableMapOf<String, Long>()

      for (stat in stats) {
        if (stat.totalTimeInForeground <= 0) continue
        val pkg = stat.packageName
        grouped[pkg] = (grouped[pkg] ?: 0L) + stat.totalTimeInForeground
        lastUsedMap[pkg] = maxOf(lastUsedMap[pkg] ?: 0L, stat.lastTimeUsed)
      }

      val appList = mutableListOf<AppUsageRecord>()
      var totalMs = 0L

      for ((pkg, timeMs) in grouped) {
        // Minimum 30 seconds to filter tiny background processes
        if (timeMs < 30_000L) continue

        val appInfo: ApplicationInfo? = try {
          pm.getApplicationInfo(pkg, 0)
        } catch (_: PackageManager.NameNotFoundException) {
          null
        }

        val appName = appInfo?.let {
          pm.getApplicationLabel(it).toString()
        } ?: pkg.substringAfterLast('.')

        val isSystem = appInfo?.let {
          (it.flags and ApplicationInfo.FLAG_SYSTEM) != 0
        } ?: true

        // Skip pure system apps with no UI (optional — keep in for now)
        totalMs += timeMs

        val record = AppUsageRecord().apply {
          this.packageName = pkg
          this.appName     = appName
          this.totalTimeMs = timeMs.toDouble()
          this.lastUsed    = (lastUsedMap[pkg] ?: 0L).toDouble()
          this.isSystemApp = isSystem
        }
        appList.add(record)
      }

      // Sort by usage desc, top 20
      appList.sortByDescending { it.totalTimeMs }

      result.totalTodayMs = totalMs.toDouble()
      result.apps = appList.take(20)
      result
    }
  }

  // ── Permission helper ────────────────────────────────────────────────────
  private fun checkPermission(): Boolean {
    val ctx = appContext.reactContext ?: return false
    val usm = ctx.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
      ?: return false
    // Query a 1-minute window — if empty we have no permission
    val now = System.currentTimeMillis()
    val stats = usm.queryUsageStats(
      UsageStatsManager.INTERVAL_WEEKLY, now - 60_000L, now
    )
    return stats != null && stats.isNotEmpty()
  }
}
