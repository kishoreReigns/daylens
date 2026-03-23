// ─────────────────────────────────────────────
//  InsightTag · Pill label for insight screens
// ─────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Radii } from '../constants';
import { useApp } from '../context/AppContext';

interface InsightTagProps {
  label:   string;
  accent?: boolean;
}

export default function InsightTag({ label, accent = false }: InsightTagProps) {
  const { colors } = useApp();
  return (
    <View style={[
      styles.tag,
      { backgroundColor: colors.cardElevated, borderColor: colors.cardBorder },
      accent && styles.accentTag,
    ]}>
      <Text style={[styles.text, { color: colors.textSecondary }, accent && { color: colors.accentPurple }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 12,
    paddingVertical:    5,
    borderRadius:      Radii.full,
    backgroundColor:   Colors.cardElevated,
    borderWidth:       1,
    borderColor:       Colors.cardBorder,
    marginRight:       8,
    marginBottom:      6,
  },
  accentTag: {
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderColor:     'rgba(139,92,246,0.35)',
  },
  text: {
    ...Typography.labelMD,
    color:    Colors.textSecondary,
    fontSize: 12,
  },
  accentText: {
    color: Colors.accentPurple,
  },
});
