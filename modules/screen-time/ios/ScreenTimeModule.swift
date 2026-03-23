// ─────────────────────────────────────────────
//  ScreenTimeModule.swift  (iOS stub)
//  Apple's Screen Time API requires a special
//  FamilyControls entitlement only granted to
//  parental control apps.
//  This stub always returns { permitted: false }
//  so the JS layer shows a graceful message.
// ─────────────────────────────────────────────
import ExpoModulesCore

public class ScreenTimeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ScreenTime")

    AsyncFunction("hasPermission") { () -> Bool in
      return false
    }

    AsyncFunction("openPermissionSettings") { () in
      // No-op: nothing to open on iOS for screen time
    }

    AsyncFunction("getUsageStats") { () -> [String: Any] in
      return [
        "permitted":    false,
        "totalTodayMs": 0.0,
        "apps":         [] as [[String: Any]],
      ]
    }
  }
}
