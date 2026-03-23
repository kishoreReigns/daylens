// ─────────────────────────────────────────────
//  HistoryItem · Past-day score card
// ─────────────────────────────────────────────
import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Radii, Shadow } from '../constants';
import { useApp } from '../context/AppContext';
import { getScoreTier, HistoryEntry } from '../data/mockData';
import { GradientScoreRing } from '../constants/colors';

interface HistoryItemProps {
  item:    HistoryEntry;
  onPress: () => void;
  index?:  number;
}

export default function HistoryItem({ item, onPress, index = 0 }: HistoryItemProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, {
      toValue:         0.975,
      useNativeDriver: true,
      speed:           60,
    }).start();

  const handlePressOut = () =>
    Animated.spring(scale, {
      toValue:         1,
      useNativeDriver: true,
      speed:           60,
    }).start();

  const { tier } = getScoreTier(item.score);
  const gradColors = GradientScoreRing[tier];
  const { colors } = useApp();

  const scoreBgMap: Record<typeof tier, string> = {
    fire:      'rgba(244,63,94,0.14)',    // rose-red tier
    warn:      'rgba(245,158,11,0.14)',   // amber tier
    good:      'rgba(45,212,191,0.12)',   // teal tier
    excellent: 'rgba(139,92,246,0.15)',   // violet tier
  };

  const scoreColorMap: Record<typeof tier, string> = {
    fire:      colors.scoreFire,
    warn:      colors.scoreWarn,
    good:      colors.scoreGood,
    excellent: colors.scoreExcellent,
  };

  const scoreBg    = scoreBgMap[tier];
  const scoreColor = scoreColorMap[tier];

  return (
    <Animated.View style={[{ transform: [{ scale }] }, styles.wrapper]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Left: emoji + date + summary */}
          <View style={styles.left}>
            <View style={styles.emojiRow}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={[styles.date, { color: colors.textSecondary }]}>{item.date}</Text>
            </View>
            <Text style={[styles.summary, { color: colors.textTertiary }]} numberOfLines={2}>
              {item.summary}
            </Text>
          </View>

          {/* Right: score bubble */}
          <View style={[styles.scoreBubble, { backgroundColor: scoreBg }]}>
            <Text style={[styles.scoreNumber, { color: scoreColor }]}>
              {item.score}
            </Text>
            <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>score</Text>

            <LinearGradient
              colors={gradColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.indicator}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
  },
  card: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.card,
    borderRadius:    Radii.xl,
    borderWidth:     1,
    borderColor:     Colors.cardBorder,
    padding:         16,
    ...Shadow.sm,
  },
  left: {
    flex:        1,
    marginRight: 12,
  },
  emojiRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    marginBottom:  6,
  },
  emoji: {
    fontSize: 18,
  },
  date: {
    ...Typography.labelMD,
    color:    Colors.textSecondary,
    fontSize: 12,
  },
  summary: {
    ...Typography.bodySM,
    color:      Colors.textTertiary,
    lineHeight: 18,
  },
  scoreBubble: {
    width:          64,
    height:         64,
    borderRadius:   Radii.lg,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
    overflow:       'hidden',
  },
  scoreNumber: {
    ...Typography.scoreNumeralSM,
    fontSize: 26,
  },
  scoreLabel: {
    ...Typography.labelSM,
    color:     Colors.textMuted,
    fontSize:  9,
    marginTop: 1,
  },
  indicator: {
    position: 'absolute',
    bottom:   0,
    left:     0,
    right:    0,
    height:   3,
  },
});
