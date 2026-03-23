// ─────────────────────────────────────────────
//  AddExpenseSheet · Beautiful bottom-sheet style
//  modal for logging a new expense
// ─────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../context/AppContext';
import { useSpending, CATEGORIES } from '../context/SpendingContext';
import type { ExpenseCategory, CategoryMeta } from '../context/SpendingContext';
import type { ColorPalette } from '../constants/colors';
import { Typography, Spacing, Radii, Shadow } from '../constants';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function AddExpenseScreen({ navigation }: Props) {
  const { colors, isDark } = useApp();
  const { addExpense } = useSpending();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [amount, setAmount]     = useState('');
  const [note, setNote]         = useState('');
  const [selected, setSelected] = useState<ExpenseCategory>('food');

  const canSave = parseFloat(amount) > 0;

  const handleSave = () => {
    const num = parseFloat(amount);
    if (num <= 0 || isNaN(num)) return;
    addExpense(num, selected, note.trim());
    navigation.goBack();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Expense</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* ── Amount input ── */}
          <View style={styles.amountSection}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              autoFocus
              selectionColor={colors.accentAmber}
            />
          </View>

          {/* ── Note input ── */}
          <View style={styles.noteWrapper}>
            <Text style={styles.noteIcon}>📝</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="What did you spend on?"
              placeholderTextColor={colors.textTertiary}
              value={note}
              onChangeText={setNote}
              selectionColor={colors.accentPurple}
              maxLength={80}
            />
          </View>

          {/* ── Category selector ── */}
          <Text style={styles.sectionLabel}>CATEGORY</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat: CategoryMeta) => {
              const isActive = selected === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: isActive
                        ? `${cat.color}22`
                        : colors.card,
                      borderColor: isActive ? cat.color : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setSelected(cat.key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      { color: isActive ? cat.color : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Save button ── */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={!canSave}
            style={[styles.saveOuter, !canSave && { opacity: 0.45 }]}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradient}
            >
              <Text style={styles.saveText}>Save Expense</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────────
function createStyles(c: ColorPalette, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    scrollContent: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing['4xl'],
    },

    /* Header */
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.lg,
    },
    cancelText: {
      ...(Typography.labelLG as any),
      color: c.accentPurple,
    },
    headerTitle: {
      ...(Typography.h3 as any),
      color: c.textPrimary,
    },

    /* Amount */
    amountSection: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      paddingVertical: Spacing['3xl'],
    },
    currencySymbol: {
      ...(Typography.displayLG as any),
      color: c.accentAmber,
      fontWeight: '700',
      marginRight: Spacing.sm,
    },
    amountInput: {
      ...(Typography.displayXL as any),
      color: c.textPrimary,
      minWidth: 120,
      textAlign: 'center',
      paddingVertical: 0,
    },

    /* Note */
    noteWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: Radii.lg,
      borderWidth: 1.5,
      borderColor: c.cardBorder,
      paddingHorizontal: Spacing.lg,
      height: 52,
      marginBottom: Spacing.xxl,
    },
    noteIcon: {
      fontSize: 18,
      marginRight: Spacing.sm,
    },
    noteInput: {
      flex: 1,
      ...(Typography.bodyMD as any),
      color: c.textPrimary,
      paddingVertical: 0,
    },

    /* Section label */
    sectionLabel: {
      ...(Typography.labelSM as any),
      color: c.textTertiary,
      marginBottom: Spacing.md,
    },

    /* Category grid */
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing['3xl'],
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      borderRadius: Radii.xl,
      borderWidth: 1.5,
      gap: Spacing.xs + 2,
    },
    categoryEmoji: {
      fontSize: 18,
    },
    categoryLabel: {
      ...(Typography.labelMD as any),
    },

    /* Save */
    saveOuter: {
      borderRadius: Radii.lg,
      overflow: 'hidden',
      ...Shadow.accent,
    },
    saveGradient: {
      height: 56,
      borderRadius: Radii.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveText: {
      ...(Typography.labelLG as any),
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 17,
      letterSpacing: 0.3,
    },
  });
}
