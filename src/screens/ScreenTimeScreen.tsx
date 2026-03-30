// ─────────────────────────────────────────────
//  ScreenTimeScreen · Per-app usage breakdown
//  Reads live data via ScreenTime native module
//  (Android UsageStatsManager — dev build only)
//  Falls back to mock data in Expo Go.
// ─────────────────────────────────────────────
import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../context/AppContext';
import { useScreenTime, formatDuration } from '../hooks/useScreenTime';
import { ScreenTime } from '../../modules/screen-time';
import type { AppUsage } from '../../modules/screen-time';
import type { ColorPalette } from '../constants/colors';
import { Typography, Spacing, Radii, Shadow } from '../constants';

type Props = { navigation: NativeStackNavigationProp<any> };

// Deterministic color for each app (based on package name hash)
const APP_COLORS = [
  '#8B5CF6', '#EC4899', '#F97316', '#10B981',
  '#38BDF8', '#F59E0B', '#EF4444', '#2DD4BF',
];
function appColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return APP_COLORS[Math.abs(hash) % APP_COLORS.length];
}
function appInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export default function ScreenTimeScreen({ navigation }: Props) {
  const { colors, isDark } = useApp();
  const {
    isAvailable,
    hasPermission,
    loading,
    totalMs,
    totalMinutes,
    totalFormatted,
    topApps,
    requestPermission,
    refresh,
  } = useScreenTime();

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  // ── Progress ring math ──────────────────────
  // 6 hours = 100%
  const maxMinutes = 360;
  const progressPct = Math.min(totalMinutes / maxMinutes, 1);
  const ringColor =
    progressPct < 0.5 ? colors.positive :
    progressPct < 0.75 ? colors.warning : colors.negative;

  // ── Render single app row ────────────────────
  const renderApp = ({ item, index }: { item: AppUsage; index: number }) => {
    const color   = appColor(item.appName);
    const initial = appInitial(item.appName);
    const appMins = Math.round(item.totalTimeMs / 60000);
    const pct     = Math.min(100, Math.round((item.totalTimeMs / (totalMs || 1)) * 100));

    return (
      <View style={[styles.appRow, index !== 0 && styles.appRowBorder]}>
        {/* Rank */}
        <Text style={styles.appRank}>#{index + 1}</Text>

        {/* App icon (initial-based since we can't get real icons in JS) */}
        <View style={[styles.appIcon, { backgroundColor: `${color}22` }]}>
          <Text style={[styles.appInitial, { color }]}>{initial}</Text>
        </View>

        {/* Name + time */}
        <View style={styles.appInfo}>
          <Text style={styles.appName} numberOfLines={1}>{item.appName}</Text>
          <View style={styles.appBar}>
            <View style={[styles.appBarTrack, { backgroundColor: colors.cardBorder }]}>
              <View
                style={[
                  styles.appBarFill,
                  { width: `${pct}%` as any, backgroundColor: color },
                ]}
              />
            </View>
            <Text style={[styles.appPct, { color: colors.textTertiary }]}>{pct}%</Text>
          </View>
        </View>

        {/* Duration */}
        <Text style={[styles.appTime, { color }]}>{formatDuration(item.totalTimeMs)}</Text>
      </View>
    );
  };

  // ── "Not available" state for Expo Go ───────
  const renderExpoGoNote = () => (
    <View style={[styles.noteCard, { borderColor: colors.accentPurple + '40' }]}>
      <LinearGradient
        colors={[colors.accentPurple + '12', colors.gradientMid + '08']}
        style={StyleSheet.absoluteFillObject}
      />
      <Text style={styles.noteEmoji}>⚡</Text>
      <Text style={styles.noteTitle}>Dev Build Required</Text>
      <Text style={styles.noteBody}>
        Screen time tracking needs a development build. Run:{'\n\n'}
        <Text style={[styles.noteCode, { color: colors.accentTeal }]}>
          npx expo run:android
        </Text>
        {'\n\n'}
        until then, mock data is shown below.
      </Text>
    </View>
  );

  // ── iOS note ─────────────────────────────────
  const renderIOSNote = () => (
    <View style={[styles.noteCard, { borderColor: colors.accentAmber + '40' }]}>
      <LinearGradient
        colors={[colors.accentAmber + '10', colors.accentOrange + '06']}
        style={StyleSheet.absoluteFillObject}
      />
      <Text style={styles.noteEmoji}>🍎</Text>
      <Text style={styles.noteTitle}>iOS Limitation</Text>
      <Text style={styles.noteBody}>
        Apple restricts the Screen Time API to parental control apps only.
        Real-time per-app data is not available on iPhone.
      </Text>
    </View>
  );

  // ── Permission prompt ─────────────────────────
  const renderPermissionCard = () => (
    <View style={[styles.noteCard, { borderColor: colors.warning + '40' }]}>
      <LinearGradient
        colors={[colors.warning + '10', colors.accentAmber + '06']}
        style={StyleSheet.absoluteFillObject}
      />
      <Text style={styles.noteEmoji}>🔐</Text>
      <Text style={styles.noteTitle}>Permission Needed</Text>
      <Text style={styles.noteBody}>
        Grant Usage Access so DayLens can read your screen time. You'll be taken to Settings.
      </Text>
      <TouchableOpacity
        style={styles.permBtn}
        onPress={requestPermission}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.accentAmber, colors.accentOrange]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.permBtnGrad}
        >
          <Text style={styles.permBtnText}>Grant Usage Access →</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Screen Time</Text>
        <TouchableOpacity onPress={refresh}>
          <Text style={[styles.backText, { color: colors.textTertiary }]}>↻</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={topApps}
        renderItem={renderApp}
        keyExtractor={(item) => item.packageName}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* Platform / availability banners */}
            {Platform.OS === 'ios' && renderIOSNote()}
            {Platform.OS !== 'ios' && !isAvailable && renderExpoGoNote()}
            {Platform.OS !== 'ios' && isAvailable && !hasPermission && renderPermissionCard()}

            {/* ── Total card ── */}
            <View style={styles.totalCard}>
              <LinearGradient
                colors={[
                  isDark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.07)',
                  isDark ? 'rgba(99,102,241,0.06)'  : 'rgba(99,102,241,0.03)',
                ]}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Clock visual */}
              <View style={styles.clockWrap}>
                <View style={[styles.clockRing, { borderColor: colors.cardBorder }]}>
                  <View style={[styles.clockFill, { borderColor: ringColor, borderTopColor: 'transparent' as any }]} />
                  <View style={styles.clockCenter}>
                    <Text style={[styles.clockValue, { color: colors.textPrimary }]}>
                      {loading ? '…' : totalFormatted}
                    </Text>
                    <Text style={[styles.clockLabel, { color: colors.textTertiary }]}>today</Text>
                  </View>
                </View>
              </View>

              <View style={styles.totalStats}>
                <View style={styles.totalStat}>
                  <Text style={[styles.totalStatVal, { color: colors.textPrimary }]}>{topApps.length}</Text>
                  <Text style={[styles.totalStatLbl, { color: colors.textTertiary }]}>apps used</Text>
                </View>
                <View style={[styles.totalDivider, { backgroundColor: colors.divider }]} />
                <View style={styles.totalStat}>
                  <Text style={[styles.totalStatVal, { color: colors.textPrimary }]}>
                    {totalMinutes > 0 ? Math.round(totalMinutes / Math.max(topApps.length, 1)) : 0}m
                  </Text>
                  <Text style={[styles.totalStatLbl, { color: colors.textTertiary }]}>avg per app</Text>
                </View>
                <View style={[styles.totalDivider, { backgroundColor: colors.divider }]} />
                <View style={styles.totalStat}>
                  <Text style={[styles.totalStatVal, { color: colors.textPrimary }]}>
                    {totalMinutes >= 360 ? '🔴' : totalMinutes >= 180 ? '🟡' : '🟢'}
                  </Text>
                  <Text style={[styles.totalStatLbl, { color: colors.textTertiary }]}>status</Text>
                </View>
              </View>
            </View>

            {/* ── Section header ── */}
            {topApps.length > 0 && (
              <Text style={styles.sectionTitle}>Top Apps Today</Text>
            )}
          </>
        }
        ListEmptyComponent={
          loading ? (
            <Text style={styles.emptyText}>Loading…</Text>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📱</Text>
              <Text style={styles.emptyText}>No app usage data yet</Text>
              <Text style={[styles.emptyText, { fontSize: 13, marginTop: 4 }]}>
                Use your phone for a bit, then refresh.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
function createStyles(c: ColorPalette, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    backText: {
      ...(Typography.labelLG as any),
      color: c.accentPurple,
    },
    headerTitle: {
      ...(Typography.h3 as any),
      color: c.textPrimary,
    },

    list: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing['4xl'],
    },

    /* Note cards */
    noteCard: {
      marginTop: Spacing.lg,
      borderRadius: Radii.xl,
      borderWidth: 1,
      padding: Spacing.xl,
      overflow: 'hidden',
      gap: Spacing.sm,
    },
    noteEmoji: { fontSize: 28 },
    noteTitle: {
      ...(Typography.h3 as any),
      color: c.textPrimary,
    },
    noteBody: {
      ...(Typography.bodyMD as any),
      color: c.textSecondary,
      lineHeight: 22,
    },
    noteCode: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 13,
    },
    permBtn: {
      marginTop: Spacing.md,
      borderRadius: Radii.md,
      overflow: 'hidden',
    },
    permBtnGrad: {
      height: 44,
      borderRadius: Radii.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    permBtnText: {
      ...(Typography.labelMD as any),
      color: '#FFFFFF',
      fontWeight: '700',
    },

    /* Total card */
    totalCard: {
      marginTop: Spacing.lg,
      borderRadius: Radii.xl,
      borderWidth: 1,
      borderColor: c.cardBorder,
      padding: Spacing.xl,
      overflow: 'hidden',
      alignItems: 'center',
      backgroundColor: c.card,
    },
    clockWrap: {
      width: 140,
      height: 140,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xl,
    },
    clockRing: {
      width: 130,
      height: 130,
      borderRadius: 65,
      borderWidth: 10,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    clockFill: {
      position: 'absolute',
      width: 130,
      height: 130,
      borderRadius: 65,
      borderWidth: 10,
      borderColor: c.accentPurple,
    },
    clockCenter: {
      alignItems: 'center',
    },
    clockValue: {
      ...(Typography.h2 as any),
    },
    clockLabel: {
      ...(Typography.bodySM as any),
    },
    totalStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.lg,
    },
    totalStat: {
      alignItems: 'center',
      gap: 4,
    },
    totalStatVal: {
      ...(Typography.h3 as any),
    },
    totalStatLbl: {
      ...(Typography.labelSM as any),
    },
    totalDivider: {
      width: 1,
      height: 32,
    },

    /* Section title */
    sectionTitle: {
      ...(Typography.labelMD as any),
      color: c.textTertiary,
      marginTop: Spacing.xl,
      marginBottom: Spacing.sm,
    },

    /* App rows */
    appRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      gap: Spacing.md,
    },
    appRowBorder: {
      borderTopWidth: 1,
      borderTopColor: c.divider,
    },
    appRank: {
      ...(Typography.labelSM as any),
      color: c.textTertiary,
      width: 22,
      textAlign: 'right',
    },
    appIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    appInitial: {
      ...(Typography.h3 as any),
      fontWeight: '800',
    },
    appInfo: {
      flex: 1,
      gap: 6,
    },
    appName: {
      ...(Typography.labelMD as any),
      color: c.textPrimary,
      fontWeight: '600',
    },
    appBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    appBarTrack: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      overflow: 'hidden',
    },
    appBarFill: {
      height: 4,
      borderRadius: 2,
    },
    appPct: {
      ...(Typography.labelSM as any),
      width: 26,
      textAlign: 'right',
    },
    appTime: {
      ...(Typography.labelMD as any),
      fontWeight: '700',
      minWidth: 45,
      textAlign: 'right',
    },

    /* Empty */
    emptyContainer: {
      alignItems: 'center',
      paddingTop: Spacing['4xl'],
    },
    emptyEmoji: { fontSize: 40, marginBottom: Spacing.md },
    emptyText: {
      ...(Typography.bodyMD as any),
      color: c.textTertiary,
      textAlign: 'center',
    },
  });
}
