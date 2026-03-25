// ─────────────────────────────────────────────
//  screen-time · Native bridge module
//  Android: reads UsageStatsManager via the
//  ScreenTimeModule Kotlin class injected by
//  the withScreenTime config plugin.
//  iOS: not available (Apple restriction).
// ─────────────────────────────────────────────
import { NativeModules, Platform } from 'react-native';

export interface AppUsage {
  packageName: string;
  appName: string;
  totalTimeMs: number;
  lastUsed: number;
  isSystemApp: boolean;
}

export interface ScreenTimeResult {
  permitted: boolean;
  totalTodayMs: number;
  apps: AppUsage[];
}

// NativeModules.ScreenTime is registered by ScreenTimePackage
// which the config plugin injects into MainApplication.kt.
const Native = NativeModules.ScreenTime as {
  hasPermission(): Promise<boolean>;
  openPermissionSettings(): Promise<void>;
  getUsageStats(): Promise<ScreenTimeResult>;
} | undefined;

export const ScreenTime = {
  async hasPermission(): Promise<boolean> {
    if (!Native || Platform.OS !== 'android') return false;
    return Native.hasPermission();
  },

  async openPermissionSettings(): Promise<void> {
    if (!Native || Platform.OS !== 'android') return;
    return Native.openPermissionSettings();
  },

  async getUsageStats(): Promise<ScreenTimeResult> {
    if (!Native || Platform.OS !== 'android') {
      return { permitted: false, totalTodayMs: 0, apps: [] };
    }
    return Native.getUsageStats();
  },

  /** True when running in a real dev/production build (not Expo Go) */
  isAvailable(): boolean {
    return !!Native && Platform.OS === 'android';
  },
};
