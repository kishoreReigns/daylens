// ─────────────────────────────────────────────
//  screen-time · Pure JS module (no native code)
//  Returns mock/demo data for UI development.
//  Real UsageStatsManager can be added later as
//  a standalone native library once EAS supports it.
// ─────────────────────────────────────────────

export interface AppUsage {
  packageName: string;
  appName:     string;
  totalTimeMs: number;
  lastUsed:    number;
  isSystemApp: boolean;
}

export interface ScreenTimeResult {
  permitted:    boolean;
  totalTodayMs: number;
  apps:         AppUsage[];
}

export const ScreenTime = {
  async hasPermission(): Promise<boolean> {
    return false;
  },

  async openPermissionSettings(): Promise<void> {
    // No-op in JS-only build
  },

  async getUsageStats(): Promise<ScreenTimeResult> {
    return getMockData();
  },

  isAvailable(): boolean {
    return false;
  },
};

// ── Demo data ────────────────────────────────
function getMockData(): ScreenTimeResult {
  return {
    permitted: true,
    totalTodayMs: 4.2 * 3600000,
    apps: [
      { packageName: 'com.instagram.android',      appName: 'Instagram',   totalTimeMs: 72 * 60000, lastUsed: Date.now() - 300000,   isSystemApp: false },
      { packageName: 'com.google.android.youtube', appName: 'YouTube',     totalTimeMs: 65 * 60000, lastUsed: Date.now() - 900000,   isSystemApp: false },
      { packageName: 'com.whatsapp',               appName: 'WhatsApp',    totalTimeMs: 48 * 60000, lastUsed: Date.now() - 1200000,  isSystemApp: false },
      { packageName: 'com.chrome.browser',         appName: 'Chrome',      totalTimeMs: 42 * 60000, lastUsed: Date.now() - 1800000,  isSystemApp: false },
      { packageName: 'com.spotify.music',          appName: 'Spotify',     totalTimeMs: 38 * 60000, lastUsed: Date.now() - 3600000,  isSystemApp: false },
      { packageName: 'com.twitter.android',        appName: 'X (Twitter)', totalTimeMs: 25 * 60000, lastUsed: Date.now() - 7200000,  isSystemApp: false },
      { packageName: 'com.snapchat.android',       appName: 'Snapchat',    totalTimeMs: 18 * 60000, lastUsed: Date.now() - 10800000, isSystemApp: false },
      { packageName: 'com.google.android.gm',      appName: 'Gmail',       totalTimeMs: 15 * 60000, lastUsed: Date.now() - 14400000, isSystemApp: false },
    ].sort((a, b) => b.totalTimeMs - a.totalTimeMs),
  };
}
