// ─────────────────────────────────────────────
//  MetricCard · Screen time / Steps / Spending
//  RAF + useState only — zero Animated API
//  100 % New Architecture / Fabric safe
// ─────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Card from './Card';
import { Colors, Typography, Radii } from '../constants';
import { useApp } from '../context/AppContext';

const ANIM_DURATION = 1200; // ms
const ANIM_DELAY    = 300;  // ms

interface MetricCardProps {
  icon?:       string;
  label?:      string;
  value?:      string;
  unit?:       string;
  delta?:      number | string;
  deltaLabel?: string;
  progress?:   number;
  gradColors?: [string, string, ...string[]];
  onPress?:    () => void;
}

export default function MetricCard({
  icon,
  label,
  value,
  unit,
  delta,
  deltaLabel,
  progress   = 0.6,
  gradColors = [Colors.accentPurple, Colors.accentBlue],
  onPress,
}: MetricCardProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [barPx,      setBarPx]      = useState(0);
  const rafRef   = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (trackWidth <= 0) return;

    if (rafRef.current)  cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);

    const target = progress * trackWidth;
    setBarPx(0);
    startRef.current = null;

    timerRef.current = setTimeout(() => {
      function tick(ts: number) {
        if (!startRef.current) startRef.current = ts;
        const t     = Math.min((ts - startRef.current) / ANIM_DURATION, 1);
        const eased = 1 - Math.pow(1 - t, 2);   // ease-out quad
        setBarPx(eased * target);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }, ANIM_DELAY);

    return () => {
      if (rafRef.current)  cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [progress, trackWidth]);

  const numericDelta = typeof delta === 'number'
    ? delta
    : parseFloat(String(delta ?? '0'));
  const isPositive  = !isNaN(numericDelta) ? numericDelta > 0 : String(delta).startsWith('+');
  const { colors } = useApp();
  const deltaColor  = isPositive ? colors.positive : colors.negative;
  const deltaSign   = isPositive && typeof delta === 'number' ? '+' : '';

  const content = (
    <Card style={[styles.card, onPress ? styles.cardTappable : undefined]}>

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconBubble, { backgroundColor: colors.backgroundElevated, borderColor: colors.cardBorder }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.deltaContainer}>
          <Text style={[styles.delta, { color: deltaColor }]}>
            {deltaSign}{delta}
          </Text>
          <Text style={[styles.deltaLabel, { color: colors.textTertiary }]}>{deltaLabel}</Text>
        </View>
      </View>

      {/* Primary value */}
      <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.unit, { color: colors.textTertiary }]}>{unit}</Text>

      {/* Progress bar — plain Views, numeric width, no Animated */}
      <View
        style={[styles.track, { backgroundColor: colors.cardBorder }]}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        {trackWidth > 0 && (
          <View style={{ width: barPx, height: 4, borderRadius: Radii.full, overflow: 'hidden' }}>
            <LinearGradient
              colors={gradColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </View>
        )}
      </View>

      {/* Footer label */}
      <Text style={[styles.label, { color: colors.textTertiary }]}>{label}</Text>
      {onPress && (
        <Text style={[styles.tapHint, { color: colors.textTertiary }]}>tap for details →</Text>
      )}
    </Card>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    padding:   18,
    minHeight: 148,
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   10,
  },
  iconBubble: {
    width:           36,
    height:          36,
    borderRadius:    Radii.md,
    backgroundColor: Colors.backgroundElevated,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     Colors.cardBorder,
  },
  icon: {
    fontSize: 18,
  },
  deltaContainer: {
    alignItems: 'flex-end',
  },
  delta: {
    ...Typography.labelMD,
    fontSize: 12,
  },
  deltaLabel: {
    ...Typography.bodySM,
    color:     Colors.textTertiary,
    fontSize:  10,
    marginTop: 1,
  },
  value: {
    ...Typography.h2,
    color:     Colors.textPrimary,
    marginTop: 2,
  },
  unit: {
    ...Typography.bodySM,
    color:        Colors.textTertiary,
    marginTop:    2,
    marginBottom: 12,
  },
  track: {
    height:          4,
    borderRadius:    Radii.full,
    backgroundColor: Colors.cardBorder,
    overflow:        'hidden',
    marginBottom:    10,
  },
  label: {
    ...Typography.labelSM,
    color: Colors.textTertiary,
  },
  cardTappable: {
    // Slight visual affordance for tappable cards
  },
  tapHint: {
    ...Typography.bodySM,
    fontSize:  9,
    marginTop: 4,
    textAlign: 'right',
  },
});
