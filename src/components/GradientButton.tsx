// ─────────────────────────────────────────────
//  GradientButton · CTA with gradient fill
// ─────────────────────────────────────────────
import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Radii, Shadow } from '../constants';
import { useApp } from '../context/AppContext';

type ButtonVariant = 'gradient' | 'outline' | 'ghost';
type ButtonSize    = 'sm' | 'md' | 'lg';

interface GradientButtonProps {
  label:     string;
  onPress:  () => void;
  icon?:    string;
  variant?: ButtonVariant;
  size?:    ButtonSize;
  disabled?: boolean;
  style?:   ViewStyle;
}

export default function GradientButton({
  label,
  onPress,
  icon,
  variant  = 'gradient',
  size     = 'lg',
  disabled = false,
  style,
}: GradientButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const { colors } = useApp();

  const handlePressIn = () =>
    Animated.spring(scale, {
      toValue:       0.96,
      useNativeDriver: true,
      speed:         50,
      bounciness:    4,
    }).start();

  const handlePressOut = () =>
    Animated.spring(scale, {
      toValue:       1,
      useNativeDriver: true,
      speed:         50,
      bounciness:    6,
    }).start();

  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    sm: { paddingVertical: 10, paddingHorizontal: 18 },
    md: { paddingVertical: 14, paddingHorizontal: 24 },
    lg: { paddingVertical: 17, paddingHorizontal: 28 },
  };

  const textSize = {
    sm: Typography.labelMD,
    md: Typography.labelLG,
    lg: { ...Typography.labelLG, fontSize: 16, letterSpacing: 0.3 },
  }[size];

  const inner = (
    <View style={[styles.inner, sizeStyles[size]]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[textSize, styles.label]}>{label}</Text>
    </View>
  );

  if (variant === 'gradient') {
    return (
      <Animated.View
        style={[
          styles.shadow,
          { transform: [{ scale }] },
          disabled && styles.disabled,
          style,
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          disabled={disabled}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            {inner}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'outline') {
    return (
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          disabled={disabled}
          style={[styles.outline, sizeStyles[size]]}
        >
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={[textSize, { color: colors.accentPurple }]}>{label}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ghost
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        disabled={disabled}
        style={[styles.ghost, sizeStyles[size]]}
      >
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={[textSize, { color: colors.textSecondary }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    ...Shadow.accent,
    borderRadius: Radii.full,
  },
  gradient: {
    borderRadius: Radii.full,
    overflow:     'hidden',
  },
  inner: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
  },
  label: {
    color: '#F0EEFF',
  },
  icon: {
    fontSize: 18,
  },
  outline: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    borderRadius:   Radii.full,
    borderWidth:    1.5,
    borderColor:    'rgba(139,92,246,0.6)',
  },
  ghost: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
  },
  disabled: {
    opacity: 0.45,
  },
});
