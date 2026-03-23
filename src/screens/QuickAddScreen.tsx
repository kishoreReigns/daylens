// ─────────────────────────────────────────────
//  QuickAddScreen · Chat-style expense logger
//  User types "paid 500 for food on paytm"
//  → Smart parser extracts amount + category
//  → Confirm and save
// ─────────────────────────────────────────────
import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../context/AppContext';
import { useSpending, getCategoryMeta } from '../context/SpendingContext';
import type { ExpenseCategory } from '../context/SpendingContext';
import type { ColorPalette } from '../constants/colors';
import { Typography, Spacing, Radii, Shadow } from '../constants';
import { parseExpenseMessage, EXAMPLE_MESSAGES } from '../utils/parseExpenseMessage';
import type { ParsedExpense } from '../utils/parseExpenseMessage';

type Props = { navigation: NativeStackNavigationProp<any> };

// ── Chat message type ─────────────────────────
interface ChatMessage {
  id:        string;
  type:      'user' | 'bot' | 'parsed' | 'saved';
  text:      string;
  parsed?:   ParsedExpense;
  timestamp: number;
}

let _msgId = 0;
const mkId = () => String(++_msgId);

export default function QuickAddScreen({ navigation }: Props) {
  const { colors, isDark } = useApp();
  const { addExpense } = useSpending();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [input, setInput]         = useState('');
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [pendingParse, setPendingParse] = useState<ParsedExpense | null>(null);
  const flatRef = useRef<FlatList<ChatMessage>>(null);

  // Welcome message on first mount
  useEffect(() => {
    setMessages([
      {
        id: mkId(),
        type: 'bot',
        text: 'Hey! Just tell me what you spent — I\'ll figure out the rest.\n\nTry something like:\n"Paid ₹500 for lunch on Paytm"',
        timestamp: Date.now(),
      },
    ]);
  }, []);

  // ── Send message handler ────────────────────
  const handleSend = () => {
    const msg = input.trim();
    if (!msg) return;
    setInput('');

    // Add user message
    const userMsg: ChatMessage = {
      id: mkId(), type: 'user', text: msg, timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Parse it
    setTimeout(() => {
      const parsed = parseExpenseMessage(msg);

      if (parsed.amount && parsed.amount > 0) {
        const catMeta = getCategoryMeta(parsed.category);
        const payStr = parsed.paymentMethod ? ` via ${parsed.paymentMethod}` : '';

        const botMsg: ChatMessage = {
          id: mkId(),
          type: 'parsed',
          text: `Got it! Here's what I understood:`,
          parsed,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, botMsg]);
        setPendingParse(parsed);
      } else {
        const botMsg: ChatMessage = {
          id: mkId(),
          type: 'bot',
          text: 'Hmm, I couldn\'t find an amount in that. Try including the price, like "Coffee ₹150" or "Uber $12".',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    }, 400); // small delay for natural feel
  };

  // ── Confirm parsed expense ──────────────────
  const handleConfirm = () => {
    if (!pendingParse || !pendingParse.amount) return;
    addExpense(pendingParse.amount, pendingParse.category, pendingParse.note);

    const savedMsg: ChatMessage = {
      id: mkId(),
      type: 'saved',
      text: `Saved! ₹${pendingParse.amount.toFixed(2)} added to ${getCategoryMeta(pendingParse.category).label}.`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, savedMsg]);
    setPendingParse(null);
  };

  // ── Example chip tap ────────────────────────
  const handleExample = (text: string) => {
    setInput(text);
  };

  // ── Render chat bubble ──────────────────────
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (item.type === 'user') {
      return (
        <View style={styles.userBubbleRow}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientMid]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.userBubble}
          >
            <Text style={styles.userBubbleText}>{item.text}</Text>
          </LinearGradient>
        </View>
      );
    }

    if (item.type === 'parsed' && item.parsed) {
      const p = item.parsed;
      const catMeta = getCategoryMeta(p.category);
      return (
        <View style={styles.botBubbleRow}>
          <View style={[styles.botBubble, styles.parsedBubble]}>
            <Text style={styles.botBubbleText}>{item.text}</Text>

            {/* Parsed summary card */}
            <View style={styles.parsedCard}>
              <View style={styles.parsedRow}>
                <Text style={styles.parsedLabel}>Amount</Text>
                <Text style={styles.parsedValue}>
                  {p.amount != null ? `₹${p.amount.toFixed(2)}` : '—'}
                </Text>
              </View>
              <View style={styles.parsedRow}>
                <Text style={styles.parsedLabel}>Category</Text>
                <View style={styles.parsedCatRow}>
                  <Text style={styles.parsedCatEmoji}>{catMeta.emoji}</Text>
                  <Text style={[styles.parsedCatText, { color: catMeta.color }]}>
                    {catMeta.label}
                  </Text>
                </View>
              </View>
              {p.paymentMethod && (
                <View style={styles.parsedRow}>
                  <Text style={styles.parsedLabel}>Paid via</Text>
                  <Text style={styles.parsedValue}>{p.paymentMethod}</Text>
                </View>
              )}
              {p.note.length > 0 && (
                <View style={styles.parsedRow}>
                  <Text style={styles.parsedLabel}>Note</Text>
                  <Text style={styles.parsedValue} numberOfLines={2}>{p.note}</Text>
                </View>
              )}
              <View style={styles.parsedRow}>
                <Text style={styles.parsedLabel}>Confidence</Text>
                <View style={styles.confidenceBar}>
                  <View
                    style={[
                      styles.confidenceFill,
                      {
                        width: `${Math.round(p.confidence * 100)}%` as any,
                        backgroundColor:
                          p.confidence > 0.7 ? colors.positive :
                          p.confidence > 0.4 ? colors.warning : colors.negative,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Confirm / Edit buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.positive, colors.accentTeal]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmGrad}
                >
                  <Text style={styles.confirmText}>✓ Save</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => {
                  setPendingParse(null);
                  navigation.navigate('AddExpense');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.editText}>✎ Edit manually</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    if (item.type === 'saved') {
      return (
        <View style={styles.botBubbleRow}>
          <View style={[styles.botBubble, styles.savedBubble]}>
            <Text style={styles.savedText}>✅ {item.text}</Text>
          </View>
        </View>
      );
    }

    // Regular bot message
    return (
      <View style={styles.botBubbleRow}>
        <View style={styles.botBubble}>
          <Text style={styles.botBubbleText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quick Add</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* ── Chat messages ── */}
        <FlatList
          ref={flatRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatRef.current?.scrollToEnd({ animated: true })
          }
          ListFooterComponent={
            messages.length <= 1 ? (
              <View style={styles.examplesSection}>
                <Text style={styles.examplesLabel}>TRY THESE</Text>
                <View style={styles.examplesGrid}>
                  {EXAMPLE_MESSAGES.slice(0, 6).map((ex, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.exampleChip}
                      onPress={() => handleExample(ex)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.exampleText}>{ex}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null
          }
        />

        {/* ── Input bar ── */}
        <View
          style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Tell me what you spent..."
              placeholderTextColor={colors.textTertiary}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              selectionColor={colors.accentPurple}
              multiline={false}
            />
          </View>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                input.trim()
                  ? [colors.gradientStart, colors.gradientMid]
                  : [colors.cardBorder, colors.cardBorder]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendBtn}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────────
function createStyles(c: ColorPalette, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },

    /* Header */
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    backText: {
      ...(Typography.labelLG as any),
      color: c.accentPurple,
    },
    headerTitle: {
      ...(Typography.h3 as any),
      color: c.textPrimary,
    },

    /* Chat list */
    chatList: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
    },

    /* User bubble */
    userBubbleRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: Spacing.md,
    },
    userBubble: {
      maxWidth: '80%',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: Radii.xl,
      borderBottomRightRadius: 6,
    },
    userBubbleText: {
      ...(Typography.bodyMD as any),
      color: '#FFFFFF',
    },

    /* Bot bubble */
    botBubbleRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      marginBottom: Spacing.md,
    },
    botBubble: {
      maxWidth: '88%',
      backgroundColor: c.card,
      borderRadius: Radii.xl,
      borderBottomLeftRadius: 6,
      borderWidth: 1,
      borderColor: c.cardBorder,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    botBubbleText: {
      ...(Typography.bodyMD as any),
      color: c.textPrimary,
      lineHeight: 22,
    },

    /* Parsed bubble extras */
    parsedBubble: {
      paddingBottom: Spacing.sm,
    },
    parsedCard: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
      borderRadius: Radii.md,
      padding: Spacing.md,
      marginTop: Spacing.md,
      gap: Spacing.sm,
    },
    parsedRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    parsedLabel: {
      ...(Typography.labelMD as any),
      color: c.textTertiary,
    },
    parsedValue: {
      ...(Typography.labelMD as any),
      color: c.textPrimary,
      fontWeight: '700',
      maxWidth: '60%',
      textAlign: 'right',
    },
    parsedCatRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    parsedCatEmoji: { fontSize: 16 },
    parsedCatText: {
      ...(Typography.labelMD as any),
      fontWeight: '700',
    },
    confidenceBar: {
      width: 80,
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      overflow: 'hidden',
    },
    confidenceFill: {
      height: 6,
      borderRadius: 3,
    },

    /* Action buttons */
    actionRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.md,
    },
    confirmBtn: {
      flex: 1,
      borderRadius: Radii.md,
      overflow: 'hidden',
    },
    confirmGrad: {
      height: 40,
      borderRadius: Radii.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmText: {
      ...(Typography.labelMD as any),
      color: '#FFFFFF',
      fontWeight: '700',
    },
    editBtn: {
      flex: 1,
      height: 40,
      borderRadius: Radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    editText: {
      ...(Typography.labelMD as any),
      color: c.textSecondary,
    },

    /* Saved bubble */
    savedBubble: {
      backgroundColor: isDark ? 'rgba(16,185,129,0.10)' : 'rgba(16,185,129,0.08)',
      borderColor: isDark ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.20)',
    },
    savedText: {
      ...(Typography.bodyMD as any),
      color: c.positive,
      fontWeight: '600',
    },

    /* Examples */
    examplesSection: {
      paddingTop: Spacing.xl,
    },
    examplesLabel: {
      ...(Typography.labelSM as any),
      color: c.textTertiary,
      marginBottom: Spacing.md,
    },
    examplesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    exampleChip: {
      backgroundColor: c.card,
      borderRadius: Radii.xl,
      borderWidth: 1,
      borderColor: c.cardBorder,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    exampleText: {
      ...(Typography.bodySM as any),
      color: c.textSecondary,
    },

    /* Input bar */
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: c.divider,
      backgroundColor: c.background,
      gap: Spacing.sm,
    },
    inputWrapper: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: Radii.xl,
      borderWidth: 1,
      borderColor: c.cardBorder,
      paddingHorizontal: Spacing.lg,
      minHeight: 46,
      justifyContent: 'center',
    },
    textInput: {
      ...(Typography.bodyMD as any),
      color: c.textPrimary,
      paddingVertical: Platform.OS === 'ios' ? Spacing.md : Spacing.sm,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendIcon: {
      fontSize: 20,
      color: '#FFFFFF',
      fontWeight: '800',
    },
  });
}
