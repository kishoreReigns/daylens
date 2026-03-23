// ─────────────────────────────────────────────
//  HistoryScreen · Past-day score log
// ─────────────────────────────────────────────
import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  ListRenderItemInfo,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { HistoryItem } from '../components';
import { Colors, Typography, Spacing, Radii } from '../constants';
import type { ColorPalette } from '../constants/colors';
import type { ScoreTier } from '../constants/colors';
import { useApp } from '../context/AppContext';
import { historyData, getScoreTier, HistoryEntry } from '../data/mockData';
import type { RootTabParamList } from '../navigation/AppNavigator';

type HistoryScreenProps = {
  navigation: BottomTabNavigationProp<RootTabParamList, 'History'>;
};

// ── Weekly average stats ─────────────────────
const weekScores = historyData.map((d) => d.score);
const weekAvg    = Math.round(weekScores.reduce((a, b) => a + b, 0) / weekScores.length);
const weekHigh   = Math.max(...weekScores);
const weekLow    = Math.min(...weekScores);

export default function HistoryScreen({ navigation }: HistoryScreenProps) {
  const headerFade = useRef(new Animated.Value(0)).current;
  const { colors, openDrawer } = useApp();

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue:         1,
      duration:        500,
      easing:          Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  const { tier } = getScoreTier(weekAvg);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const renderItem = ({ item, index }: ListRenderItemInfo<HistoryEntry>) => (
    <HistoryItem item={item} index={index} onPress={() => {}} />
  );

  const ListHeader = () => (
    <Animated.View style={{ opacity: headerFade }}>
      {/* Page title */}
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
          <Text style={styles.pageTitle}>History</Text>
          <Text style={styles.pageSubtitle}>Last 7 days</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>4 day streak</Text>
        </View>
      </View>

      {/* Weekly summary card */}
      <LinearGradient
        colors={['rgba(139,92,246,0.20)', 'rgba(56,189,248,0.12)', colors.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.summaryCard}
      >
        <Text style={styles.summaryLabel}>WEEKLY AVERAGE</Text>
        <Text style={styles.summaryScore}>{weekAvg}</Text>
        <Text style={styles.summaryScoreLabel}>Life Score</Text>

        {/* Mini sparkline bars */}
        <View style={styles.sparkline}>
          {weekScores
            .slice()
            .reverse()
            .map((s, i) => {
              const { tier: t } = getScoreTier(s);
              const barColorMap: Record<ScoreTier, string> = {
                fire:      colors.scoreFire,
                warn:      colors.scoreWarn,
                good:      colors.scoreGood,
                excellent: colors.scoreExcellent,
              };
              const barColor = barColorMap[t];
              const barH     = Math.max(6, (s / 100) * 44);
              return (
                <View key={i} style={styles.sparkBarWrapper}>
                  <View
                    style={[
                      styles.sparkBar,
                      { height: barH, backgroundColor: barColor },
                      i === 0 && styles.sparkBarCurrent,
                    ]}
                  />
                </View>
              );
            })}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatPill label="High" value={weekHigh} color={colors.scoreGood}      />
          <View style={styles.statsDivider} />
          <StatPill label="Avg"  value={weekAvg}  color={colors.scoreExcellent} />
          <View style={styles.statsDivider} />
          <StatPill label="Low"  value={weekLow}  color={colors.scoreFire}      />
        </View>
      </LinearGradient>

      {/* List header */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>Daily Breakdown</Text>
        <Text style={styles.listHeaderSub}>{historyData.length} entries</Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={colors.background === '#0C0B16' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <FlatList<HistoryEntry>
          data={historyData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
          ListFooterComponent={<View style={{ height: 32 }} />}
        />
      </SafeAreaView>
    </View>
  );
}

// ── Sub-components ───────────────────────────

interface StatPillProps { label: string; value: number; color: string; }

function StatPill({ label, value, color }: StatPillProps) {
  const { colors } = useApp();
  return (
    <View style={pillStyles.container}>
      <Text style={[pillStyles.value, { color }]}>{value}</Text>
      <Text style={[pillStyles.label, { color: colors.textTertiary }]}>{label}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────

function createStyles(c: ColorPalette) { return StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: c.background,
  },
  safeArea: {
    flex: 1,
  },
  listContent: {
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
  pageSubtitle: {
    ...Typography.bodySM,
    color: c.textTertiary,
  },
  streakBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   'rgba(245,158,11,0.12)',
    borderRadius:      Radii.full,
    paddingHorizontal: 12,
    paddingVertical:    7,
    borderWidth:       1,
    borderColor:       'rgba(245,158,11,0.25)',
    marginTop:         6,
  },
  streakEmoji: { fontSize: 14 },
  streakText: {
    ...Typography.labelMD,
    color:    c.scoreWarn,
    fontSize: 12,
  },
  summaryCard: {
    borderRadius: Radii.xxl,
    borderWidth:  1,
    borderColor:  'rgba(139,92,246,0.28)',
    padding:      22,
    marginBottom: 24,
    alignItems:   'center',
  },
  summaryLabel: {
    ...Typography.labelSM,
    color:        c.textTertiary,
    marginBottom: 6,
    letterSpacing: 1.5,
  },
  summaryScore: {
    ...Typography.displayLG,
    color: c.accentPurple,
  },
  summaryScoreLabel: {
    ...Typography.bodySM,
    color:        c.textTertiary,
    marginTop:    2,
    marginBottom: 18,
  },
  sparkline: {
    flexDirection: 'row',
    alignItems:    'flex-end',
    gap:           6,
    marginBottom:  18,
    height:        48,
  },
  sparkBarWrapper: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'flex-end',
    height:         48,
  },
  sparkBar: {
    width:        '100%',
    borderRadius: 3,
    opacity:      0.7,
  },
  sparkBarCurrent: {
    opacity:      1,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             0,
    backgroundColor: c.cardElevated,
    borderRadius:    Radii.lg,
    paddingVertical: 10,
    borderWidth:     1,
    borderColor:     c.cardBorder,
    alignSelf:       'stretch',
  },
  statsDivider: {
    width:            1,
    height:           28,
    backgroundColor:  c.divider,
    marginHorizontal: 16,
  },
  listHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'baseline',
    marginBottom:   14,
  },
  listHeaderTitle: {
    ...Typography.h3,
    color: c.textPrimary,
  },
  listHeaderSub: {
    ...Typography.bodySM,
    color: c.textTertiary,
  },
}); }

const pillStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex:       1,
  },
  value: {
    ...Typography.h3,
    fontSize: 22,
  },
  label: {
    ...Typography.labelSM,
    marginTop: 2,
  },
});
