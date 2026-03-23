// ─────────────────────────────────────────────
//  ScoreCircle · Animated SVG ring (TypeScript)
//  RAF + useState only — zero Animated API on SVG
//  100 % New Architecture / Fabric safe
// ─────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../constants';
import { getScoreTier } from '../data/mockData';
import type { ScoreTier } from '../constants/colors';

// ── geometry ─────────────────────────────────
const BASE    = 220;
const STROKE  = 14;
const RADIUS  = (BASE - STROKE) / 2;
const CIRCUMF = 2 * Math.PI * RADIUS;

// ── tier → solid color ────────────────────────
const TIER_COLOR: Record<ScoreTier, string> = {
  excellent: '#8B5CF6',  // violet  — thriving / peak
  good:      '#2DD4BF',  // teal    — balanced / healthy
  warn:      '#F59E0B',  // amber   — caution
  fire:      '#F43F5E',  // rose    — urgent
};
const DEFAULT_COLOR = '#2DD4BF';

const ANIM_DURATION = 1400; // ms

interface ScoreCircleProps {
  score?: number;
  size?:  number;
}

export default function ScoreCircle({ score = 78, size = BASE }: ScoreCircleProps) {
  const scale = size / BASE;
  const sw    = STROKE * scale;
  const r     = RADIUS * scale;
  const cx    = size / 2;
  const cy    = size / 2;
  const circ  = CIRCUMF * scale;

  const { tier, label } = getScoreTier(score);
  const arcColor        = TIER_COLOR[tier] ?? DEFAULT_COLOR;

  // ── RAF animation ────────────────────────────
  const [current, setCurrent]   = useState(0);
  const rafRef    = useRef<number | null>(null);
  const startRef  = useRef<number | null>(null);
  const prevScore = useRef<number>(0);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = prevScore.current;
    const to   = score;
    startRef.current = null;

    function tick(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const t     = Math.min((ts - startRef.current) / ANIM_DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3);       // ease-out cubic
      setCurrent(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevScore.current = to;
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [score]);

  // plain numeric SVG values — no Animated, no interpolation
  const offset  = circ * (1 - current / 100);
  const rounded = Math.round(current);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>

        {/* ① Background track */}
        <Circle
          cx={cx} cy={cy} r={r}
          stroke={Colors.cardBorder}
          strokeWidth={sw}
          fill="none"
        />

        {/* ② Glow halo */}
        <Circle
          cx={cx} cy={cy} r={r}
          stroke={arcColor}
          strokeWidth={sw + 8 * scale}
          fill="none"
          opacity={0.15}
          strokeDasharray={`${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />

        {/* ③ Main arc */}
        <Circle
          cx={cx} cy={cy} r={r}
          stroke={arcColor}
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          strokeDashoffset={offset}
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />

      </Svg>

      {/* Center content */}
      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        <Text style={[styles.num, { fontSize: 48 * scale, color: arcColor }]}>
          {rounded}
        </Text>
        <Text style={[styles.tag, { fontSize: 10 * scale }]}>LIFE SCORE</Text>
        <View style={[styles.pill, { borderColor: arcColor + '44' }]}>
          <Text style={[styles.pillTxt, { color: arcColor, fontSize: 10 * scale }]}>
            {label}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  num: {
    fontWeight:    '800',
    letterSpacing: -1,
  },
  tag: {
    color:         Colors.textTertiary,
    fontWeight:    '600',
    letterSpacing: 2,
    marginTop:     3,
  },
  pill: {
    marginTop:         8,
    paddingHorizontal: 10,
    paddingVertical:   3,
    borderRadius:      20,
    borderWidth:       1,
    backgroundColor:   'rgba(255,255,255,0.05)',
  },
  pillTxt: {
    fontWeight:    '700',
    letterSpacing: 0.5,
  },
});
