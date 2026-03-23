// ─────────────────────────────────────────────
//  screen-time · Local Expo Module
//  Android: UsageStatsManager → per-app usage
//  iOS:     Not available (Apple restriction)
// ─────────────────────────────────────────────
import { NativeModule, requireNativeModule } from 'expo-modules-core';

export interface AppUsage {
  packageName: string;
  appName:     string;
  totalTimeMs: number;   // milliseconds foreground today
  lastUsed:    number;   // unix timestamp ms
  isSystemApp: boolean;
}

export interface ScreenTimeResult {
  permitted:      boolean;   // false = user hasn't granted PACKAGE_USAGE_STATS
  totalTodayMs:   number;    // sum of all app usage today in ms
  apps:           AppUsage[];
}

declare class ScreenTimeNativeModule extends NativeModule {
  /**
   * Returns whether the app has PACKAGE_USAGE_STATS permission.
   * On iOS: always returns false.
   */
  hasPermission(): Promise<boolean>;

  /**
   * Opens Android Settings > Usage Access so user can grant permission.
   * No-op on iOS.
   */
  openPermissionSettings(): Promise<void>;

  /**
   * Returns usage stats for today (midnight → now).
   * Returns { permitted: false, apps: [] } if permission not granted.
   * On iOS always returns { permitted: false, apps: [] }.
   */
  getUsageStats(): Promise<ScreenTimeResult>;
}

// requireNativeModule throws if native side isn't present (Expo Go)
// We wrap it so the app still works gracefully in Expo Go with mock data.
let NativeScreenTime: ScreenTimeNativeModule | null = null;

try {
  NativeScreenTime = requireNativeModule<ScreenTimeNativeModule>('ScreenTime');
} catch {
  // Running in Expo Go — native module not available
  NativeScreenTime = null;
}

export const ScreenTime = {
  async hasPermission(): Promise<boolean> {
    if (!NativeScreenTime) return false;
    return NativeScreenTime.hasPermission();
  },

  async openPermissionSettings(): Promise<void> {
    if (!NativeScreenTime) return;
    return NativeScreenTime.openPermissionSettings();
  },

  async getUsageStats(): Promise<ScreenTimeResult> {
    if (!NativeScreenTime) {
      // Return mock data when running in Expo Go for UI development
      return getMockData();
    }
    return NativeScreenTime.getUsageStats();
  },

  /** True if the native module is linked (i.e. dev build) */
  isAvailable(): boolean {
    return NativeScreenTime !== null;
  },
};

// ── Mock data (for Expo Go / dev preview) ────
function getMockData(): ScreenTimeResult {
  return {
    permitted: true,
    totalTodayMs: 4.2 * 3600000, // 4h 12m
    apps: [
      { packageName: 'com.instagram.android',  appName: 'Instagram',  totalTimeMs: 72 * 60000, lastUsed: Date.now() - 300000,   isSystemApp: false },
      { packageName: 'com.google.android.youtube', appName: 'YouTube', totalTimeMs: 65 * 60000, lastUsed: Date.now() - 900000,   isSystemApp: false },
      { packageName: 'com.whatsapp',            appName: 'WhatsApp',   totalTimeMs: 48 * 60000, lastUsed: Date.now() - 1200000,  isSystemApp: false },
      { packageName: 'com.chrome.browser',      appName: 'Chrome',     totalTimeMs: 42 * 60000, lastUsed: Date.now() - 1800000,  isSystemApp: false },
      { packageName: 'com.spotify.music',       appName: 'Spotify',    totalTimeMs: 38 * 60000, lastUsed: Date.now() - 3600000,  isSystemApp: false },
      { packageName: 'com.twitter.android',     appName: 'X (Twitter)',totalTimeMs: 25 * 60000, lastUsed: Date.now() - 7200000,  isSystemApp: false },
      { packageName: 'com.snapchat.android',    appName: 'Snapchat',   totalTimeMs: 18 * 60000, lastUsed: Date.now() - 10800000, isSystemApp: false },
      { packageName: 'com.google.android.gm',   appName: 'Gmail',      totalTimeMs: 15 * 60000, lastUsed: Date.now() - 14400000, isSystemApp: false },
    ].sort((a, b) => b.totalTimeMs - a.totalTimeMs),
  };
}
