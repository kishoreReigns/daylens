// ─────────────────────────────────────────────
//  SpendingScreen · Category-wise expense view
//  Beautiful breakdown + transaction list
// ─────────────────────────────────────────────
import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { useApp } from '../context/AppContext';
import { useSpending, getCategoryMeta } from '../context/SpendingContext';
import type { Expense, CategorySummary } from '../context/SpendingContext';
import type { ColorPalette } from '../constants/colors';
import { Typography, Spacing, Radii, Shadow } from '../constants';
import type { RootTabParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: BottomTabNavigationProp<RootTabParamList, 'Spending'>;
};

export default function SpendingScreen({ navigation }: Props) {
  const { colors, isDark, openDrawer } = useApp();
  const {
    todayTotal,
    todayExpenses,
    categorySummary,
    dailyBudget,
    budgetProgress,
  } = useSpending();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  // ── Category bar chart ──────────────────────
  const renderCategoryBar = (item: CategorySummary) => {
    const meta = getCategoryMeta(item.category);
    return (
      <View key={item.category} style={styles.catRow}>
        <View style={styles.catLeft}>
          <View style={[styles.catDot, { backgroundColor: meta.color }]} />
          <Text style={styles.catEmoji}>{meta.emoji}</Text>
          <View style={styles.catInfo}>
            <Text style={styles.catLabel}>{meta.label}</Text>
            <Text style={styles.catCount}>
              {item.count} item{item.count !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <View style={styles.catRight}>
          <Text style={styles.catAmount}>${item.total.toFixed(2)}</Text>
          <Text style={[styles.catPercent, { color: meta.color }]}>
            {item.percent}%
          </Text>
        </View>
      </View>
    );
  };

  // ── Single transaction row ──────────────────
  const renderTransaction = ({ item }: { item: Expense }) => {
    const meta = getCategoryMeta(item.category);
    const time = new Date(item.createdAt);
    const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <View style={styles.txRow}>
        <View style={[styles.txIcon, { backgroundColor: `${meta.color}18` }]}>
          <Text style={styles.txEmoji}>{meta.emoji}</Text>
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txNote} numberOfLines={1}>
            {item.note || meta.label}
          </Text>
          <Text style={styles.txMeta}>
            {meta.label} · {timeStr}
          </Text>
        </View>
        <Text style={styles.txAmount}>-${item.amount.toFixed(2)}</Text>
      </View>
    );
  };

  // ── Header component for FlatList ───────────
  const ListHeader = () => (
    <>
      {/* ── Header bar ── */}
      <View style={styles.header}>
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
        <Text style={styles.headerTitle}>Spending</Text>
        <TouchableOpacity
          style={styles.quickAddBtn}
          onPress={() => (navigation as any).navigate('QuickAdd')}
        >
          <LinearGradient
            colors={[colors.accentPurple, colors.gradientMid]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quickAddGrad}
          >
            <Text style={styles.quickAddBtnIcon}>💬</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => (navigation as any).navigate('AddExpense')}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addGradient}
          >
            <Text style={styles.addIcon}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Budget card ── */}
      <View style={styles.budgetCard}>
        <LinearGradient
          colors={[
            isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)',
            isDark ? 'rgba(249,115,22,0.06)' : 'rgba(249,115,22,0.03)',
          ]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Text style={styles.budgetLabel}>SPENT TODAY</Text>
        <Text style={styles.budgetAmount}>${todayTotal.toFixed(2)}</Text>
        <Text style={styles.budgetSub}>
          of ${dailyBudget.toFixed(0)} daily budget
        </Text>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={
              budgetProgress > 0.85
                ? [colors.negative, '#FF7043']
                : [colors.accentAmber, colors.accentOrange]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressFill,
              { width: `${Math.max(budgetProgress * 100, 2)}%` as any },
            ]}
          />
        </View>
        <Text style={styles.budgetPercent}>
          {Math.round(budgetProgress * 100)}% used
        </Text>
      </View>

      {/* ── Quick Add banner ── */}
      <TouchableOpacity
        style={styles.quickAddBanner}
        activeOpacity={0.8}
        onPress={() => (navigation as any).navigate('QuickAdd')}
      >
        <LinearGradient
          colors={[
            isDark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.08)',
            isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)',
          ]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Text style={styles.quickAddEmoji}>💬</Text>
        <View style={styles.quickAddInfo}>
          <Text style={styles.quickAddTitle}>Quick Add</Text>
          <Text style={styles.quickAddSub}>Type "paid 500 for food on paytm"</Text>
        </View>
        <Text style={styles.quickAddArrow}>→</Text>
      </TouchableOpacity>

      {/* ── Category breakdown ── */}
      {categorySummary.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          <View style={styles.catBarContainer}>
            {/* Stacked color bar */}
            <View style={styles.stackedBar}>
              {categorySummary.map((cs) => {
                const meta = getCategoryMeta(cs.category);
                return (
                  <View
                    key={cs.category}
                    style={[
                      styles.stackedSegment,
                      {
                        flex: cs.percent,
                        backgroundColor: meta.color,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
          {categorySummary.map(renderCategoryBar)}
        </View>
      )}

      {/* ── Transactions header ── */}
      <View style={styles.txHeader}>
        <Text style={styles.sectionTitle}>Today's Transactions</Text>
        <Text style={styles.txCount}>{todayExpenses.length}</Text>
      </View>
    </>
  );

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <SafeAreaView edges={['top']} style={styles.flex}>
        <FlatList
          data={todayExpenses}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>💸</Text>
              <Text style={styles.emptyText}>No expenses logged today</Text>
              <Text style={styles.emptySubtext}>
                Tap + to add your first expense
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────
function createStyles(c: ColorPalette, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    list: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing['4xl'],
    },

    /* Header */
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
      paddingBottom: 20,
    },
    hamburger: {
      justifyContent: 'center',
      gap: 5,
      paddingRight: 14,
      paddingVertical: 4,
    },
    hamburgerLine: {
      width: 22,
      height: 2,
      borderRadius: 1,
    },
    headerTitle: {
      ...(Typography.h2 as any),
      color: c.textPrimary,
      flex: 1,
      marginLeft: 2,
    },
    addButton: {
      borderRadius: 14,
      overflow: 'hidden',
    },
    quickAddBtn: {
      borderRadius: 14,
      overflow: 'hidden',
      marginRight: Spacing.sm,
    },
    quickAddGrad: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickAddBtnIcon: {
      fontSize: 18,
    },
    quickAddBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: Radii.lg,
      borderWidth: 1,
      borderColor: c.cardBorder,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      marginBottom: Spacing.lg,
      overflow: 'hidden',
    },
    quickAddEmoji: {
      fontSize: 28,
      marginRight: Spacing.md,
    },
    quickAddInfo: {
      flex: 1,
    },
    quickAddTitle: {
      ...(Typography.labelLG as any),
      color: c.textPrimary,
      fontWeight: '700',
    },
    quickAddSub: {
      ...(Typography.bodySM as any),
      color: c.textTertiary,
      marginTop: 2,
    },
    quickAddArrow: {
      ...(Typography.h3 as any),
      color: c.accentPurple,
    },
    addGradient: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addIcon: {
      fontSize: 24,
      color: '#FFFFFF',
      fontWeight: '600',
      lineHeight: 28,
    },

    /* Budget card */
    budgetCard: {
      backgroundColor: c.card,
      borderRadius: Radii.xl,
      borderWidth: 1,
      borderColor: c.cardBorder,
      padding: Spacing.xl,
      marginBottom: Spacing.lg,
      overflow: 'hidden',
    },
    budgetLabel: {
      ...(Typography.labelSM as any),
      color: c.textTertiary,
      marginBottom: Spacing.xs,
    },
    budgetAmount: {
      ...(Typography.displayLG as any),
      color: c.accentAmber,
      fontWeight: '800',
    },
    budgetSub: {
      ...(Typography.bodySM as any),
      color: c.textSecondary,
      marginTop: 2,
      marginBottom: Spacing.lg,
    },
    progressTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      overflow: 'hidden',
    },
    progressFill: {
      height: 8,
      borderRadius: 4,
    },
    budgetPercent: {
      ...(Typography.labelMD as any),
      color: c.textTertiary,
      marginTop: Spacing.sm,
      textAlign: 'right',
    },

    /* Section card */
    sectionCard: {
      backgroundColor: c.card,
      borderRadius: Radii.xl,
      borderWidth: 1,
      borderColor: c.cardBorder,
      padding: Spacing.xl,
      marginBottom: Spacing.lg,
    },
    sectionTitle: {
      ...(Typography.h3 as any),
      color: c.textPrimary,
      marginBottom: Spacing.md,
    },

    /* Stacked bar */
    catBarContainer: {
      marginBottom: Spacing.lg,
    },
    stackedBar: {
      flexDirection: 'row',
      height: 10,
      borderRadius: 5,
      overflow: 'hidden',
      gap: 2,
    },
    stackedSegment: {
      borderRadius: 5,
    },

    /* Category rows */
    catRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.sm,
    },
    catLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: Spacing.sm,
    },
    catDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    catEmoji: {
      fontSize: 18,
    },
    catInfo: {
      flex: 1,
    },
    catLabel: {
      ...(Typography.labelMD as any),
      color: c.textPrimary,
    },
    catCount: {
      ...(Typography.bodySM as any),
      color: c.textTertiary,
      fontSize: 11,
    },
    catRight: {
      alignItems: 'flex-end',
    },
    catAmount: {
      ...(Typography.labelLG as any),
      color: c.textPrimary,
    },
    catPercent: {
      ...(Typography.labelSM as any),
      fontSize: 11,
    },

    /* Transactions */
    txHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
      marginTop: Spacing.xs,
    },
    txCount: {
      ...(Typography.labelMD as any),
      color: c.textTertiary,
    },
    txRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: Radii.lg,
      borderWidth: 1,
      borderColor: c.cardBorder,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      gap: Spacing.md,
    },
    txIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    txEmoji: {
      fontSize: 20,
    },
    txInfo: {
      flex: 1,
    },
    txNote: {
      ...(Typography.labelMD as any),
      color: c.textPrimary,
      marginBottom: 2,
    },
    txMeta: {
      ...(Typography.bodySM as any),
      color: c.textTertiary,
      fontSize: 12,
    },
    txAmount: {
      ...(Typography.labelLG as any),
      color: c.negative,
    },

    /* Empty */
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: Spacing['4xl'],
    },
    emptyEmoji: {
      fontSize: 40,
      marginBottom: Spacing.md,
    },
    emptyText: {
      ...(Typography.h3 as any),
      color: c.textSecondary,
    },
    emptySubtext: {
      ...(Typography.bodySM as any),
      color: c.textTertiary,
      marginTop: Spacing.xs,
    },
  });
}
