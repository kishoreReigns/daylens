// ─────────────────────────────────────────────
//  Toast · Themed slide-in notifications
//  Used via useToast() hook throughout the app
// ─────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { Radii, Spacing, Typography, Shadow } from '../constants';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastConfig {
  message:  string;
  variant:  ToastVariant;
  duration?: number; // ms, default 3500
}

interface ToastProps extends ToastConfig {
  onHide: () => void;
}

const ICON: Record<ToastVariant, string> = {
  success: '✓',
  error:   '✕',
  info:    '✦',
};

export default function Toast({ message, variant, duration = 3500, onHide }: ToastProps) {
  const { colors } = useApp();
  const insets     = useSafeAreaInsets();
  const slideAnim  = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const accentColor =
    variant === 'success' ? colors.accentTeal :
    variant === 'error'   ? '#F87171' :
                            colors.accentPurple;

  const gradientColors: [string, string] =
    variant === 'success' ? ['rgba(45,212,191,0.18)', 'rgba(45,212,191,0.06)'] :
    variant === 'error'   ? ['rgba(248,113,113,0.18)', 'rgba(248,113,113,0.06)'] :
                            ['rgba(139,92,246,0.20)', 'rgba(139,92,246,0.06)'];

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue:         0,
        damping:         20,
        stiffness:       220,
        mass:            0.7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue:         1,
        duration:        220,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss
    const timer = setTimeout(() => dismiss(), duration);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue:         -120,
        duration:        260,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue:         0,
        duration:        220,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  }

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top:       insets.top + 12,
          opacity:   opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity activeOpacity={0.9} onPress={dismiss}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.container,
            {
              backgroundColor: colors.card,
              borderColor:     accentColor + '55',
            },
          ]}
        >
          {/* Left accent bar */}
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: accentColor + '22' }]}>
            <Text style={[styles.icon, { color: accentColor }]}>
              {ICON[variant]}
            </Text>
          </View>

          {/* Message */}
          <Text style={[styles.message, { color: colors.textPrimary }]} numberOfLines={3}>
            {message}
          </Text>

          {/* Dismiss X */}
          <Text style={[styles.close, { color: colors.textTertiary }]}>✕</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position:  'absolute',
    left:       Spacing.lg,
    right:      Spacing.lg,
    zIndex:     9999,
    elevation:  20,
  },
  container: {
    flexDirection:  'row',
    alignItems:     'center',
    borderRadius:   Radii.xl,
    borderWidth:    1,
    overflow:       'hidden',
    paddingVertical: 14,
    paddingRight:   16,
    gap:            12,
    ...Shadow.card,
  },
  accentBar: {
    width:       3,
    alignSelf:  'stretch',
    borderRadius: 2,
    marginLeft:  12,
    flexShrink:  0,
  },
  iconCircle: {
    width:          32,
    height:         32,
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  icon: {
    fontSize:   14,
    fontWeight: '700',
  },
  message: {
    ...Typography.bodySM as any,
    flex:       1,
    lineHeight: 20,
  },
  close: {
    fontSize:   12,
    flexShrink: 0,
  },
});
