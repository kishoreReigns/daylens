// ─────────────────────────────────────────────
//  InsightsScreen · AI-generated daily summary
// ─────────────────────────────────────────────
import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { Card, ScoreCircle, InsightTag, GradientButton } from '../components';
import { Colors, Typography, Spacing, Radii, Shadow } from '../constants';
import type { ColorPalette } from '../constants/colors';
import { GradientScoreRing } from '../constants/colors';
import { useApp } from '../context/AppContext';
import {
  insightData,
  todayData,
  getScoreTier,
  formatDate,
} from '../data/mockData';
import type { RootTabParamList } from '../navigation/AppNavigator';

type InsightsScreenProps = {
  navigation: BottomTabNavigationProp<RootTabParamList, 'Insights'>;
};

export default function InsightsScreen({ navigation }: InsightsScreenProps) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  const { colors, openDrawer } = useApp();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
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
  }, []);

  const { tier }     = getScoreTier(insightData.lifeScore);
  const ringColors   = GradientScoreRing[tier];

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

          {/* ── Hero score card ─────────────────── */}
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
                <ScoreCircle score={insightData.lifeScore} size={160} />

                <View style={styles.heroText}>
                  <Text style={styles.heroEmoji}>{insightData.moodEmoji}</Text>
                  <Text style={styles.heroMood}>{insightData.mood}</Text>
                  <Text style={styles.heroMoodLabel}>Today's mood</Text>

                  <View style={styles.heroDivider} />

                  <StatRow
                    label="Screen"
                    value={`${todayData.screenTime.hours}h ${todayData.screenTime.minutes}m`}
                  />
                  <StatRow
                    label="Steps"
                    value={todayData.steps.count.toLocaleString()}
                  />
                  <StatRow
                    label="Spent"
                    value={`$${todayData.spending.amount.toFixed(0)}`}
                  />
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── Key Insight card ────────────────── */}
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
                  <Text style={styles.insightIconText}>{insightData.emoji}</Text>
                </LinearGradient>
                <Text style={styles.insightCardLabel}>Today's key finding</Text>
              </View>
              <Text style={styles.insightBody}>{insightData.keyInsight}</Text>
            </Card>
          </AnimatedCard>

          {/* ── Suggestion card ─────────────────── */}
          <SectionLabel emoji="✅" title="AI Suggestion" delay={200} />

          <AnimatedCard delay={250}>
            <Card style={styles.suggestionCard}>
              <View style={styles.suggestionBar} />
              <Text style={styles.suggestionBody}>{insightData.suggestion}</Text>
            </Card>
          </AnimatedCard>

          {/* ── Tags ────────────────────────────── */}
          <AnimatedCard delay={320}>
            <View style={styles.tagsSection}>
              <Text style={styles.tagsLabel}>Topics covered</Text>
              <View style={styles.tagsRow}>
                {insightData.tags.map((t) => (
                  <InsightTag key={t} label={t} accent />
                ))}
              </View>
            </View>
          </AnimatedCard>

          {/* ── Quick actions ───────────────────── */}
          <AnimatedCard delay={400}>
            <View style={styles.actions}>
              <GradientButton
                label="See Full History"
                icon="📅"
                onPress={() => navigation.navigate('History')}
                size="md"
                style={styles.actionBtn}
              />
              <GradientButton
                label="Share Insight"
                icon="↗️"
                onPress={() => {}}
                variant="outline"
                size="md"
                style={styles.actionBtn}
              />
            </View>
          </AnimatedCard>

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
