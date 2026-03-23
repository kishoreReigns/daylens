// ─────────────────────────────────────────────
//  Card · Base reusable card shell
// ─────────────────────────────────────────────
import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radii, Shadow } from '../constants';
import { useApp } from '../context/AppContext';

interface CardProps {
  children:     React.ReactNode;
  style?:        StyleProp<ViewStyle>;
  gradient?:    boolean;
  elevated?:    boolean;
  accentBorder?: boolean;
}

export default function Card({
  children,
  style,
  gradient     = false,
  elevated     = false,
  accentBorder = false,
}: CardProps) {
  const { colors } = useApp();
  const bg = elevated ? colors.cardElevated : colors.card;

  if (gradient) {
    return (
      <LinearGradient
        colors={['rgba(139,92,246,0.16)', 'rgba(56,189,248,0.06)', bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: colors.cardBorder }, accentBorder && styles.accentBorder, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: bg, borderColor: colors.cardBorder },
        accentBorder && styles.accentBorder,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding:      20,
    borderWidth:  1,
    borderColor:  Colors.cardBorder,
    ...Shadow.md,
  },
  accentBorder: {
    borderColor: 'rgba(139,92,246,0.4)',
  },
});
