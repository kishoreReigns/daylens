// ─────────────────────────────────────────────
//  InsightsScreen · AI-generated daily summary
// ─────────────────────────────────────────────
import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { Card, ScoreCircle, InsightTag, GradientButton } from '../components';
import { Colors, Typography, Spacing, Radii, Shadow } from '../constants';
import type { ColorPalette } from '../constants/colors';
import { GradientScoreRing } from '../constants/colors';
import { useApp }     from '../context/AppContext';
import { useSpending } from '../context/SpendingContext';
import { useAuth }     from '../context/AuthContext';
import { fetchRecentSteps }      from '../lib/api/steps';
import { fetchRecentScreenTime } from '../lib/api/screenTime';
import { getProfile }            from '../lib/api/auth';
import { getAIInsights }         from '../lib/api/ai';
import type { AIInsightResult }  from '../lib/api/ai';
import { getScoreTier, formatDate } from '../data/mockData';
import type { RootTabParamList } from '../navigation/AppNavigator';

type InsightsScreenProps = {
  navigation: BottomTabNavigationProp<RootTabParamList, 'Insights'>;
};

export default function InsightsScreen({ navigation }: InsightsScreenProps) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  const { colors, openDrawer } = useApp();
  const { user }               = useAuth();
  const { todayTotal, todayExpenses, dailyBudget } = useSpending();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // ── Real data state ───────────────────────────
  const [insight,   setInsight]   = useState<AIInsightResult | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [todaySteps, setTodaySteps] = useState(0);
  const [stepGoal,   setStepGoal]  = useState(10_000);
  const [screenMs,   setScreenMs]  = useState(0);
  const [topApps,    setTopApps]   = useState<{ appName: string; totalTimeMs: number }[]>([]);

  // ── Fetch all data then call AI ───────────────
  const loadInsights = useCallback(async () => {
    setLoading(true);
    try {
      const [stepsData, screenData, profile] = await Promise.all([
        fetchRecentSteps(1),
        fetchRecentScreenTime(1),
        getProfile(),
      ]);

      const steps   = stepsData[0]?.steps   ?? 0;
      const goal    = profile?.step_goal    ?? 10_000;
      const budget  = profile?.daily_budget ?? dailyBudget;
      const totalMs = screenData[0]?.total_ms ?? 0;
      const apps    = (screenData[0]?.apps_json as any[] ?? []) as { appName: string; totalTimeMs: number }[];

      setTodaySteps(steps);
      setStepGoal(goal);
      setScreenMs(totalMs);
      setTopApps(apps);

      const topCategories = todayExpenses
        .reduce<Record<string, number>>((acc, e) => {
          acc[e.category] = (acc[e.category] ?? 0) + e.amount;
          return acc;
        }, {});
      const sortedCats = Object.entries(topCategories)
        .sort((a, b) => b[1] - a[1])
        .map(([k]) => k);

      const result = await getAIInsights({
        steps,
        stepGoal:      goal,
        screenTimeMs:  totalMs,
        topApps:       apps.slice(0, 5),
        totalSpent:    todayTotal,
        dailyBudget:   budget,
        topCategories: sortedCats.slice(0, 3),
      });

      setInsight(result);
    } catch (e) {
      console.error('[InsightsScreen] loadInsights error:', e);
    } finally {
      setLoading(false);
    }
  }, [todayExpenses, todayTotal, dailyBudget]);

  useEffect(() => {
    if (user) loadInsights();
  }, [user, loadInsights]);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue:         1,
          duration:        600,
          easing:          Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue:         0,
          duration:        550,
          easing:          Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  // Derived display values
  const screenHours   = Math.floor(screenMs / 3_600_000);
  const screenMinutes = Math.floor((screenMs % 3_600_000) / 60_000);
  const lifeScore     = insight?.lifeScore ?? 0;
  const { tier }      = getScoreTier(lifeScore);
  const ringColors    = GradientScoreRing[tier];

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={colors.textPrimary === '#F0EEFF' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView edges={['top']}>
          {/* ── Page header ─────────────────────── */}
          <View style={styles.pageHeader}>
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
              <Text style={styles.pageTitle}>AI Insight</Text>
              <Text style={styles.pageDate}>{formatDate()}</Text>
            </View>
            <View style={styles.aiBadge}>
              <LinearGradient
                colors={['rgba(139,92,246,0.3)', 'rgba(56,189,248,0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.aiBadgeGradient}
              >
                <Text style={styles.aiBadgeText}>✦ Powered by AI</Text>
              </LinearGradient>
            </View>
          </View>

          {/* ── Loading state ──────────────────── */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accentPurple} />
              <Text style={styles.loadingText}>Analysing your day…</Text>
            </View>
          ) : (
            <>
              {/* ── Hero score card ─────────────── */}
              <Animated.View
                style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
              >
                <LinearGradient
                  colors={[
                    'rgba(139,92,246,0.18)',
                    'rgba(56,189,248,0.10)',
                    colors.card,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroCard}
                >
                  <View style={styles.heroOrb} />

                  <View style={styles.heroInner}>
                    <ScoreCircle score={lifeScore} size={160} />

                    <View style={styles.heroText}>
                      <Text style={styles.heroEmoji}>{insight?.moodEmoji ?? '😌'}</Text>
                      <Text style={styles.heroMood}>{insight?.mood ?? '—'}</Text>
                      <Text style={styles.heroMoodLabel}>Today's mood</Text>

                      <View style={styles.heroDivider} />

                      <StatRow
                        label="Screen"
                        value={`${screenHours}h ${screenMinutes}m`}
                      />
                      <StatRow
                        label="Steps"
                        value={todaySteps.toLocaleString()}
                      />
                      <StatRow
                        label="Spent"
                        value={`$${todayTotal.toFixed(0)}`}
                      />
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* ── Key Insight card ────────────── */}
              <SectionLabel emoji="💡" title="Key Insight" delay={100} />

              <AnimatedCard delay={150}>
                <Card gradient accentBorder style={styles.insightCard}>
                  <View style={styles.insightIconRow}>
                    <LinearGradient
                      colors={ringColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.insightIconBubble}
                    >
                      <Text style={styles.insightIconText}>{insight?.emoji ?? '💡'}</Text>
                    </LinearGradient>
                    <Text style={styles.insightCardLabel}>Today's key finding</Text>
                  </View>
                  <Text style={styles.insightBody}>{insight?.keyInsight ?? ''}</Text>
                </Card>
              </AnimatedCard>

              {/* ── Suggestion card ─────────────── */}
              <SectionLabel emoji="✅" title="AI Suggestion" delay={200} />

              <AnimatedCard delay={250}>
                <Card style={styles.suggestionCard}>
                  <View style={styles.suggestionBar} />
                  <Text style={styles.suggestionBody}>{insight?.suggestion ?? ''}</Text>
                </Card>
              </AnimatedCard>

              {/* ── Tags ────────────────────────── */}
              <AnimatedCard delay={320}>
                <View style={styles.tagsSection}>
                  <Text style={styles.tagsLabel}>Topics covered</Text>
                  <View style={styles.tagsRow}>
                    {(insight?.tags ?? []).map((t) => (
                      <InsightTag key={t} label={t} accent />
                    ))}
                  </View>
                </View>
              </AnimatedCard>

              {/* ── Quick actions ───────────────── */}
              <AnimatedCard delay={400}>
                <View style={styles.actions}>
                  <GradientButton
                    label="Refresh Insights"
                    icon="✦"
                    onPress={loadInsights}
                    size="md"
                    style={styles.actionBtn}
                  />
                  <GradientButton
                    label="See Full History"
                    icon="📅"
                    onPress={() => navigation.navigate('History')}
                    variant="outline"
                    size="md"
                    style={styles.actionBtn}
                  />
                </View>
              </AnimatedCard>
            </>
          )}

          <View style={{ height: 32 }} />
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

// ── Sub-components ───────────────────────────

interface StatRowProps { label: string; value: string; }

function StatRow({ label, value }: StatRowProps) {
  const { colors } = useApp();
  return (
    <View style={statStyles.row}>
      <Text style={[statStyles.label, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[statStyles.value, { color: colors.textSecondary }]}>{value}</Text>
    </View>
  );
}

interface SectionLabelProps { emoji: string; title: string; delay?: number; }

function SectionLabel({ emoji, title, delay = 0 }: SectionLabelProps) {
  const { colors } = useApp();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue:         1,
      duration:        400,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[secLabelStyles.row, { opacity: fadeAnim }]}>
      <Text style={secLabelStyles.emoji}>{emoji}</Text>
      <Text style={[secLabelStyles.title, { color: colors.textPrimary }]}>{title}</Text>
    </Animated.View>
  );
}

interface AnimatedCardProps { children: React.ReactNode; delay?: number; }

function AnimatedCard({ children, delay = 0 }: AnimatedCardProps) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue:         1,
        duration:        500,
        delay,
        easing:          Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue:         0,
        duration:        450,
        delay,
        easing:          Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      {children}
    </Animated.View>
  );
}

// ── Styles ───────────────────────────────────

function createStyles(c: ColorPalette) { return StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: c.background,
  },
  scroll: {
    paddingHorizontal: Spacing.xl,
  },
  pageHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
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
  pageTitle: {
    ...Typography.h1,
    color:       c.textPrimary,
    marginBottom: 3,
  },
  pageDate: {
    ...Typography.bodySM,
    color: c.textTertiary,
  },
  aiBadge: {
    borderRadius: Radii.full,
    overflow:     'hidden',
    marginTop:    4,
  },
  aiBadgeGradient: {
    paddingHorizontal: 12,
    paddingVertical:    6,
    borderRadius:      Radii.full,
    borderWidth:       1,
    borderColor:       'rgba(139,92,246,0.35)',
  },
  aiBadgeText: {
    ...Typography.labelSM,
    color:    c.accentPurple,
    fontSize: 11,
  },
  heroCard: {
    borderRadius: Radii.xxl,
    borderWidth:  1,
    borderColor:  'rgba(139,92,246,0.3)',
    padding:      20,
    marginBottom: 24,
    overflow:     'hidden',
    ...Shadow.accent,
  },
  heroOrb: {
    position:        'absolute',
    top:             -40,
    right:           -40,
    width:            160,
    height:           160,
    borderRadius:     80,
    backgroundColor: 'rgba(139,92,246,0.14)',
  },
  heroInner: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           16,
  },
  heroText: {
    flex:       1,
    alignItems: 'flex-start',
  },
  heroEmoji: {
    fontSize:     32,
    marginBottom: 4,
  },
  heroMood: {
    ...Typography.h2,
    color: c.textPrimary,
  },
  heroMoodLabel: {
    ...Typography.bodySM,
    color:     c.textTertiary,
    marginTop: 2,
  },
  heroDivider: {
    height:          1,
    backgroundColor: c.divider,
    alignSelf:       'stretch',
    marginVertical:  12,
  },
  insightCard: {
    marginBottom: 20,
  },
  insightIconRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    marginBottom:  14,
  },
  insightIconBubble: {
    width:          40,
    height:         40,
    borderRadius:   Radii.md,
    alignItems:     'center',
    justifyContent: 'center',
  },
  insightIconText: {
    fontSize: 20,
  },
  insightCardLabel: {
    ...Typography.labelSM,
    color: c.textTertiary,
  },
  insightBody: {
    ...Typography.bodyLG,
    color:      c.textSecondary,
    lineHeight: 26,
  },
  suggestionCard: {
    marginBottom:  20,
    flexDirection: 'row',
    gap:           14,
    paddingLeft:   12,
  },
  suggestionBar: {
    width:           3,
    borderRadius:    Radii.full,
    backgroundColor: c.accentTeal,
    alignSelf:       'stretch',
    flexShrink:      0,
  },
  suggestionBody: {
    ...Typography.bodyLG,
    color:      c.textSecondary,
    lineHeight: 26,
    flex:       1,
  },
  tagsSection: {
    marginBottom: 20,
  },
  tagsLabel: {
    ...Typography.labelSM,
    color:        c.textTertiary,
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
  },
  actions: {
    gap:          10,
    marginBottom: 4,
  },
  actionBtn: {
    alignSelf: 'stretch',
  },
  loadingContainer: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingTop:     80,
    gap:            16,
  },
  loadingText: {
    ...Typography.bodyLG,
    color: c.textTertiary,
  },
}); }

const statStyles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   5,
    width:          '100%',
  },
  label: {
    ...Typography.bodySM,
  },
  value: {
    ...Typography.labelMD,
  },
});

const secLabelStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    marginBottom:  12,
  },
  emoji: {
    fontSize: 18,
  },
  title: {
    ...Typography.h3,
  },
});
