// ─────────────────────────────────────────────
//  useScreenTime · React hook
//  Reads per-app usage stats via native module.
//  Falls back to mock data in Expo Go.
// ─────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { ScreenTime, type ScreenTimeResult, type AppUsage } from '../../modules/screen-time';

export interface ScreenTimeState {
  /** Is the native module available? (false in Expo Go) */
  isAvailable: boolean;
  /** Does the user have PACKAGE_USAGE_STATS permission? */
  hasPermission: boolean;
  /** True while loading */
  loading: boolean;
  /** Total phone usage today in minutes */
  totalMinutes: number;
  /** Formatted string, e.g. "4h 12m" */
  totalFormatted: string;
  /** Top apps sorted by usage descending */
  topApps: AppUsage[];
  /** Request permission (opens Usage Access settings on Android) */
  requestPermission: () => Promise<void>;
  /** Re-fetch data */
  refresh: () => Promise<void>;
}

export function useScreenTime(): ScreenTimeState {
  const [data, setData] = useState<ScreenTimeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPerm] = useState(false);
  const isAvailable = ScreenTime.isAvailable();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (ScreenTime.isAvailable()) {
        const perm = await ScreenTime.hasPermission();
        setHasPerm(perm);
        if (!perm) {
          // Open Usage Access settings on first load so user sees the prompt
          await ScreenTime.openPermissionSettings();
          // Set empty state — app-state listener will refresh when user returns
          setData({ permitted: false, totalTodayMs: 0, apps: [] });
          return;
        }
      }
      const result = await ScreenTime.getUsageStats();
      setData(result);
    } catch (err) {
      console.warn('[useScreenTime]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => { load(); }, [load]);

  // Refresh when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') load();
    });
    return () => sub.remove();
  }, [load]);

  const requestPermission = useCallback(async () => {
    await ScreenTime.openPermissionSettings();
    // After the user returns from settings, the app-state listener will re-load
  }, []);

  const totalMs = data?.totalTodayMs ?? 0;
  const totalMinutes = Math.round(totalMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const totalFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const topApps = (data?.apps ?? [])
    .filter((a) => a.totalTimeMs > 0)
    .slice(0, 8);

  return {
    isAvailable,
    hasPermission: data?.permitted ?? hasPermission,
    loading,
    totalMinutes,
    totalFormatted,
    topApps,
    requestPermission,
    refresh: load,
  };
}

/** Format ms duration to readable string, e.g. "1h 24m" or "45m" */
export function formatDuration(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins < 1) return '< 1m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
