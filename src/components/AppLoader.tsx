// ─────────────────────────────────────────────
//  AppLoader · Full-screen themed loading overlay
//  Shows over any screen when a global async op
//  is in progress (auth, AI generation, etc.)
// ─────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  Easing,
} from 'react-native';
import { LinearGradient }  from 'expo-linear-gradient';
import { useApp }          from '../context/AppContext';
import { Typography, Radii } from '../constants';

interface AppLoaderProps {
  visible: boolean;
  message?: string;
}

export default function AppLoader({ visible, message = 'Please wait…' }: AppLoaderProps) {
  const { colors, isDark } = useApp();
  const opacityAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim    = useRef(new Animated.Value(0.85)).current;
  const rotateAnim   = useRef(new Animated.Value(0)).current;

  // Spin the ring continuously
  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue:         1,
        duration:        1200,
        easing:          Easing.linear,
        useNativeDriver: true,
      }),
    );
    spin.start();
    return () => spin.stop();
  }, []);

  // Fade + scale in/out
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue:         visible ? 1 : 0,
        duration:        220,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue:         visible ? 1 : 0.85,
        damping:         18,
        stiffness:       220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  if (!visible) return null;

  const spin = rotateAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.overlay, { opacity: opacityAnim }]} pointerEvents="auto">
      {/* Semi-transparent backdrop */}
      <View style={[
        StyleSheet.absoluteFillObject,
        { backgroundColor: isDark ? 'rgba(11,11,15,0.75)' : 'rgba(245,243,255,0.80)' }
      ]} />

      {/* Card */}
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor:     'rgba(139,92,246,0.25)',
            transform:       [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Gradient ring spinner */}
        <View style={styles.spinnerContainer}>
          {/* Static base ring */}
          <View style={[styles.baseRing, { borderColor: colors.divider }]} />

          {/* Spinning gradient arc */}
          <Animated.View
            style={[styles.spinArc, { transform: [{ rotate: spin }] }]}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.arcGradient}
            />
          </Animated.View>

          {/* Centre logo glow */}
          <View style={styles.centreGlow}>
            <LinearGradient
              colors={['rgba(139,92,246,0.25)', 'rgba(56,189,248,0.15)']}
              style={styles.centreGlowGradient}
            />
            <Text style={styles.centreEmoji}>⚡</Text>
          </View>
        </View>

        <Text style={[styles.message, { color: colors.textPrimary }]}>{message}</Text>
        <Text style={[styles.sub, { color: colors.textTertiary }]}>DayLens AI</Text>
      </Animated.View>
    </Animated.View>
  );
}

const RING = 72;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         9998,
    elevation:      19,
  },
  card: {
    width:          200,
    alignItems:     'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius:   Radii.xxl,
    borderWidth:    1,
    gap:            16,
    elevation:      24,
    shadowColor:    '#7B2FBE',
    shadowOpacity:  0.25,
    shadowRadius:   20,
    shadowOffset:   { width: 0, height: 8 },
  },
  spinnerContainer: {
    width:          RING,
    height:         RING,
    alignItems:     'center',
    justifyContent: 'center',
  },
  baseRing: {
    position:     'absolute',
    width:        RING,
    height:       RING,
    borderRadius: RING / 2,
    borderWidth:  3,
  },
  spinArc: {
    position:     'absolute',
    width:        RING,
    height:       RING,
    borderRadius: RING / 2,
    overflow:     'hidden',
  },
  arcGradient: {
    width:        RING / 2,
    height:       RING,
    borderTopLeftRadius: RING / 2,
    borderBottomLeftRadius: RING / 2,
  },
  centreGlow: {
    width:          RING - 18,
    height:         RING - 18,
    borderRadius:   (RING - 18) / 2,
    overflow:       'hidden',
    alignItems:     'center',
    justifyContent: 'center',
  },
  centreGlowGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  centreEmoji: {
    fontSize: 24,
  },
  message: {
    ...Typography.labelMD as any,
    textAlign: 'center',
  },
  sub: {
    ...Typography.labelSM as any,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
