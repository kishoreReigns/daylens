// ─────────────────────────────────────────────
//  DayLens AI · Signup Screen
//  Vital Dark / Light themed · Stunning auth UI
// ─────────────────────────────────────────────
import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import type { ColorPalette } from '../constants/colors';
import { Typography, Spacing, Radii, Shadow } from '../constants';

const { width } = Dimensions.get('window');

type SignupScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function SignupScreen({ navigation }: SignupScreenProps) {
  const { colors, isDark } = useApp();
  const { signUp }         = useAuth();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [fullName, setFullName]     = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);

  const [nameFocused, setNameFocused]         = useState(false);
  const [emailFocused, setEmailFocused]       = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused]   = useState(false);
  const [authError,   setAuthError]   = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Entrance animation
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 20,
        stiffness: 120,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      setAuthError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPw) {
      setAuthError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    setAuthError(null);
    setAuthLoading(true);
    const error = await signUp(email, password, fullName);
    setAuthLoading(false);
    if (error) {
      setAuthError(error);
    }
    // On success, AuthContext updates user → navigation to main app
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Background gradient orbs */}
      <View style={styles.orbContainer}>
        <LinearGradient
          colors={[
            isDark ? 'rgba(233,30,140,0.30)' : 'rgba(233,30,140,0.12)',
            'transparent',
          ]}
          style={styles.orbTopRight}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <LinearGradient
          colors={[
            isDark ? 'rgba(123,47,190,0.30)' : 'rgba(123,47,190,0.12)',
            'transparent',
          ]}
          style={styles.orbBottomLeft}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* ── Logo ── */}
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <Text style={styles.logoEmoji}>⚡</Text>
              </LinearGradient>
            </View>

            {/* ── Header ── */}
            <View style={styles.headerBlock}>
              <Text style={styles.headerTitle}>Create Account</Text>
              <Text style={styles.headerSubtitle}>
                Start tracking your life today
              </Text>
            </View>

            {/* ── Full name ── */}
            <View
              style={[
                styles.inputWrapper,
                nameFocused && styles.inputWrapperFocused,
              ]}
            >
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor={colors.textTertiary}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                selectionColor={colors.accentPurple}
              />
            </View>

            {/* ── Email ── */}
            <View
              style={[
                styles.inputWrapper,
                emailFocused && styles.inputWrapperFocused,
              ]}
            >
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                selectionColor={colors.accentPurple}
              />
            </View>

            {/* ── Password ── */}
            <View
              style={[
                styles.inputWrapper,
                passwordFocused && styles.inputWrapperFocused,
              ]}
            >
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                selectionColor={colors.accentPurple}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.eyeIcon}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Confirm password ── */}
            <View
              style={[
                styles.inputWrapper,
                confirmFocused && styles.inputWrapperFocused,
              ]}
            >
              <Text style={styles.inputIcon}>🔐</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor={colors.textTertiary}
                value={confirmPw}
                onChangeText={setConfirmPw}
                secureTextEntry={!showConfirm}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
                selectionColor={colors.accentPurple}
              />
              <TouchableOpacity
                onPress={() => setShowConfirm(!showConfirm)}
                style={styles.eyeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.eyeIcon}>
                  {showConfirm ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Terms notice ── */}
            <Text style={styles.termsText}>
              By signing up you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>

            {/* ── Auth error ── */}
            {authError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            ) : null}

            {/* ── Sign up button ── */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSignup}
              disabled={authLoading}
              style={styles.gradientButtonOuter}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.gradientButtonText}>
                  {authLoading ? 'Creating account…' : 'Create Account'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* ── Divider ── */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign up with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── Social buttons ── */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialIcon}>G</Text>
                <Text style={styles.socialLabel}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialIcon}>🍎</Text>
                <Text style={styles.socialLabel}>Apple</Text>
              </TouchableOpacity>
            </View>

            {/* ── Login link ── */}
            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.bottomLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────────
function createStyles(c: ColorPalette, isDark: boolean) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
    flex: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing['4xl'],
      paddingTop: Spacing.xl,
    },
    content: {
      width: '100%',
      maxWidth: 400,
      alignSelf: 'center',
    },

    /* ── Background orbs ── */
    orbContainer: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
    },
    orbTopRight: {
      position: 'absolute',
      top: -width * 0.25,
      right: -width * 0.2,
      width: width * 0.85,
      height: width * 0.85,
      borderRadius: width * 0.425,
    },
    orbBottomLeft: {
      position: 'absolute',
      bottom: -width * 0.3,
      left: -width * 0.15,
      width: width * 0.75,
      height: width * 0.75,
      borderRadius: width * 0.375,
    },

    /* ── Logo ── */
    logoContainer: {
      alignItems: 'center',
      marginBottom: Spacing.xxl,
    },
    logoGradient: {
      width: 64,
      height: 64,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadow.accent,
    },
    logoEmoji: {
      fontSize: 30,
    },

    /* ── Header ── */
    headerBlock: {
      marginBottom: Spacing.xxl,
    },
    headerTitle: {
      ...(Typography.h1 as any),
      color: c.textPrimary,
      textAlign: 'center',
    },
    headerSubtitle: {
      ...(Typography.bodyMD as any),
      color: c.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.xs,
    },

    /* ── Inputs ── */
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: Radii.lg,
      borderWidth: 1.5,
      borderColor: c.cardBorder,
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      height: 56,
    },
    inputWrapperFocused: {
      borderColor: c.accentPurple,
      backgroundColor: isDark
        ? 'rgba(139,92,246,0.06)'
        : 'rgba(139,92,246,0.04)',
    },
    inputIcon: {
      fontSize: 18,
      marginRight: Spacing.sm,
    },
    input: {
      flex: 1,
      ...(Typography.bodyMD as any),
      color: c.textPrimary,
      paddingVertical: 0,
    },
    eyeButton: {
      paddingLeft: Spacing.sm,
    },
    eyeIcon: {
      fontSize: 18,
    },

    /* ── Terms ── */
    termsText: {
      ...(Typography.bodySM as any),
      color: c.textTertiary,
      textAlign: 'center',
      marginTop: Spacing.sm,
      marginBottom: Spacing.xxl,
      lineHeight: 20,
    },
    termsLink: {
      color: c.accentPurple,
      fontWeight: '600',
    },

    /* ── Auth error ── */
    errorBox: {
      backgroundColor: 'rgba(239,68,68,0.12)',
      borderRadius:    Radii.md,
      borderWidth:     1,
      borderColor:     'rgba(239,68,68,0.35)',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      marginBottom:    Spacing.md,
    },
    errorText: {
      ...(Typography.bodySM as any),
      color: '#F87171',
      textAlign: 'center',
    },

    /* ── Gradient CTA ── */
    gradientButtonOuter: {
      borderRadius: Radii.lg,
      overflow: 'hidden',
      marginBottom: Spacing.xxl,
      ...Shadow.accent,
    },
    gradientButton: {
      height: 56,
      borderRadius: Radii.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gradientButtonText: {
      ...(Typography.labelLG as any),
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 17,
      letterSpacing: 0.3,
    },

    /* ── Divider ── */
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xxl,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: c.divider,
    },
    dividerText: {
      ...(Typography.labelMD as any),
      color: c.textTertiary,
      marginHorizontal: Spacing.md,
    },

    /* ── Social ── */
    socialRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing['3xl'],
    },
    socialButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 52,
      borderRadius: Radii.lg,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.cardBorder,
      gap: Spacing.sm,
    },
    socialIcon: {
      fontSize: 20,
      color: c.textPrimary,
      fontWeight: '700',
    },
    socialLabel: {
      ...(Typography.labelMD as any),
      color: c.textPrimary,
    },

    /* ── Bottom link ── */
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    bottomText: {
      ...(Typography.bodyMD as any),
      color: c.textSecondary,
    },
    bottomLink: {
      ...(Typography.labelLG as any),
      color: c.accentPurple,
    },
  });
}
