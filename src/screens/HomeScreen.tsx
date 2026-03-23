// ─────────────────────────────────────────────
//  HomeScreen · Life Score + daily metrics
// ─────────────────────────────────────────────
import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { ScoreCircle, MetricCard, GradientButton } from '../components';
import { Colors, Typography, Spacing } from '../constants';
import type { ColorPalette } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { useStepCounter } from '../hooks/useStepCounter';
import { useSpending } from '../context/SpendingContext';
import { useScreenTime } from '../hooks/useScreenTime';
import {
  todayData,
  formatDate,
  getGreeting,
  getScoreTier,
} from '../data/mockData';
import type { RootTabParamList } from '../navigation/AppNavigator';
import type { ScoreTier } from '../constants/colors';

type HomeScreenProps = {
  navigation: BottomTabNavigationProp<RootTabParamList, 'Home'>;
};

// ── tier → glow rgba ──────────────────────────
const tierGlowMap: Record<ScoreTier, string> = {
  fire:      'rgba(244,63,94,0.20)',    // rose glow — urgent
  warn:      'rgba(245,158,11,0.18)',   // amber glow — caution
  good:      'rgba(45,212,191,0.18)',   // teal glow  — balanced
  excellent: 'rgba(139,92,246,0.24)',   // violet glow — peak
};

const getGlowOrbStyle = (tier: ScoreTier): ViewStyle => ({
  backgroundColor: tierGlowMap[tier] ?? tierGlowMap.excellent,
});

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [refreshing, setRefreshing] = React.useState(false);
  const { colors, openDrawer } = useApp();
  const stepData = useStepCounter(10_000);
  const { todayTotal, budgetProgress, dailyBudget } = useSpending();
  const screenTime = useScreenTime();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const { tier } = getScoreTier(todayData.lifeScore);

  const styles = useMemo(() => createStyles(colors), [colors]);

  // Format delta string
  const stepDelta = stepData.deltaVsAvg >= 0
    ? `+${(stepData.deltaVsAvg / 1000).toFixed(1)}k`
    : `${(stepData.deltaVsAvg / 1000).toFixed(1)}k`;

  const metrics = [
    {
      icon:       '📱',
      label:      'SCREEN TIME',
      value:      screenTime.loading ? '…' : screenTime.totalFormatted,
      unit:       'today',
      delta:      screenTime.topApps[0]?.appName ?? 'loading…',
      deltaLabel: 'top app',
      progress:   Math.min(screenTime.totalMinutes / 360, 1), // 6h = 100%
      gradColors: [colors.accentOrange, colors.accentPink] as [string, string],
      onPress:    () => (navigation as any).navigate('ScreenTime'),
    },
    {
      icon:       '👟',
      label:      'STEPS',
      value:      stepData.todaySteps.toLocaleString(),
      unit:       stepData.isTracking ? 'live tracking' : 'steps taken',
      delta:      stepDelta,
      deltaLabel: 'vs avg',
      progress:   stepData.progress,
      gradColors: [colors.accentTeal, colors.accentBlue] as [string, string],
    },
    {
      icon:       '💳',
      label:      'SPENDING',
      value:      `$${todayTotal.toFixed(2)}`,
      unit:       'spent today',
      delta:      `$${(dailyBudget - todayTotal).toFixed(0)}`,
      deltaLabel: 'left of budget',
      progress:   budgetProgress,
      gradColors: [colors.accentAmber, colors.accentOrange] as [string, string],
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={colors.background === '#0C0B16' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentPurple}
            colors={[colors.accentPurple]}
          />
        }
      >
        <SafeAreaView edges={['top']}>
          {/* ── Header ─────────────────────────── */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={openDrawer}
              style={styles.hamburger}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[styles.hamburgerLine, { backgroundColor: colors.textPrimary }]}
                />
              ))}
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{getGreeting()} 👋</Text>
              <Text style={styles.date}>{formatDate()}</Text>
            </View>

            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>A</Text>
            </LinearGradient>
          </View>

          {/* ── Score section ───────────────────── */}
          <View style={styles.scoreSection}>
            <View style={styles.scoreWrapper}>
              <View style={[styles.glowOrb, getGlowOrbStyle(tier)]} />
              <ScoreCircle score={todayData.lifeScore} size={220} />
            </View>

            {/* Tier badge */}
            <View style={styles.tierBadge}>
              <LinearGradient
                colors={['rgba(139,92,246,0.2)', 'rgba(236,72,153,0.12)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tierGradient}
              >
                <Text style={styles.tierText}>
                  {getScoreTier(todayData.lifeScore).label} Day
                </Text>
              </LinearGradient>
            </View>
          </View>

          {/* ── Section label ────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Metrics</Text>
            <Text style={styles.sectionSub}>Updated just now</Text>
          </View>

          {/* ── Metric cards grid ────────────────── */}
          <View style={styles.metricsGrid}>
            <MetricCard {...metrics[0]} />

            <View style={styles.row}>
              {[metrics[1], metrics[2]].map((m, i) => (
                <View key={i} style={styles.halfCard}>
                  <MetricCard {...m} />
                </View>
              ))}
            </View>
          </View>

          {/* ── Quick Add expense shortcut ────── */}
          <TouchableOpacity
            style={styles.quickAddCard}
            activeOpacity={0.8}
            onPress={() => (navigation as any).navigate('QuickAdd')}
          >
            <LinearGradient
              colors={[colors.gradientStart + '18', colors.gradientMid + '10']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.quickAddIcon}>💬</Text>
            <View style={styles.quickAddInfo}>
              <Text style={styles.quickAddTitle}>Quick Add Expense</Text>
              <Text style={styles.quickAddSub}>Just type what you spent</Text>
            </View>
            <Text style={styles.quickAddArrow}>→</Text>
          </TouchableOpacity>

          {/* ── AI Insight CTA ───────────────────── */}
          <View style={styles.ctaSection}>
            <View style={styles.teaser}>
              <Text style={styles.teaserEmoji}>🧠</Text>
              <Text style={styles.teaserText} numberOfLines={2}>
                Your focus peaked this morning — AI has a suggestion for tonight.
              </Text>
            </View>

            <GradientButton
              label="View AI Insight"
              icon="✨"
              onPress={() => navigation.navigate('Insights')}
              size="lg"
              style={styles.ctaButton}
            />
          </View>

          <View style={{ height: 32 }} />
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

function createStyles(c: ColorPalette) { return StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: c.background,
  },
  scroll: {
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingTop:      8,
    paddingBottom:  20,
  },
  hamburger: {
    justifyContent: 'center',
    gap:             5,
    paddingRight:   14,
    paddingVertical: 4,
  },
  hamburgerLine: {
    width:        22,
    height:        2,
    borderRadius:  1,
  },
  greeting: {
    ...Typography.h2,
    color:       c.textPrimary,
    marginBottom: 2,
  },
  date: {
    ...Typography.bodySM,
    color: c.textTertiary,
  },
  avatar: {
    width:          44,
    height:         44,
    borderRadius:   22,
    alignItems:     'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.labelLG,
    color:      c.textPrimary,
    fontSize:   18,
    fontWeight: '700',
  },
  scoreSection: {
    alignItems:     'center',
    paddingVertical: Spacing.xl,
    marginBottom:   Spacing.sm,
  },
  scoreWrapper: {
    width:          220,
    height:         220,
    alignItems:     'center',
    justifyContent: 'center',
  },
  glowOrb: {
    position:     'absolute',
    width:         240,
    height:        240,
    borderRadius:  120,
  },
  tierBadge: {
    marginTop:    16,
    borderRadius: 99,
    overflow:     'hidden',
  },
  tierGradient: {
    paddingHorizontal: 18,
    paddingVertical:    7,
    borderRadius:       99,
    borderWidth:        1,
    borderColor:       'rgba(139,92,246,0.3)',
  },
  tierText: {
    ...Typography.labelMD,
    color:    c.accentPurple,
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'baseline',
    marginBottom:   Spacing.md,
    marginTop:      Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h3,
    color: c.textPrimary,
  },
  sectionSub: {
    ...Typography.bodySM,
    color: c.textTertiary,
  },
  metricsGrid: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap:           10,
  },
  halfCard: {
    flex: 1,
  },
  ctaSection: {
    marginTop:  Spacing.xxl,
    gap:        14,
    alignItems: 'center',
  },
  teaser: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: c.card,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     c.cardBorder,
    padding:         14,
    gap:             10,
    alignSelf:       'stretch',
  },
  teaserEmoji: {
    fontSize: 22,
  },
  teaserText: {
    ...Typography.bodyMD,
    color: c.textSecondary,
    flex:  1,
  },
  ctaButton: {
    alignSelf: 'stretch',
  },
  quickAddCard: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: c.card,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     c.cardBorder,
    padding:         16,
    marginTop:       Spacing.lg,
    overflow:        'hidden',
  },
  quickAddIcon: {
    fontSize: 26,
    marginRight: 12,
  },
  quickAddInfo: {
    flex: 1,
  },
  quickAddTitle: {
    ...Typography.labelLG,
    color: c.textPrimary,
    fontWeight: '700' as const,
  },
  quickAddSub: {
    ...Typography.bodySM,
    color: c.textTertiary,
    marginTop: 2,
  },
  quickAddArrow: {
    ...Typography.h3,
    color: c.accentPurple,
  },
}); }
