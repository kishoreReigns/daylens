// ─────────────────────────────────────────────
//  DayLens AI · Login Screen
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
import { useToast } from '../context/ToastContext';
import { AppLoader } from '../components';
import type { ColorPalette } from '../constants/colors';
import { Typography, Spacing, Radii, Shadow } from '../constants';

const { width } = Dimensions.get('window');

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { colors, isDark } = useApp();
  const { signIn }         = useAuth();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused]     = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const { showToast } = useToast();

  // Subtle entrance animation
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

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showToast({ message: 'Please enter your email and password.', variant: 'error' });
      return;
    }
    setAuthLoading(true);
    const error = await signIn(email, password);
    setAuthLoading(false);
    if (error) {
      showToast({ message: error, variant: 'error' });
    }
    // On success, AuthContext updates user → AppContext.isAuthenticated → navigation
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Background gradient orbs */}
      <View style={styles.orbContainer}>
        <LinearGradient
          colors={[
            isDark ? 'rgba(123,47,190,0.35)' : 'rgba(123,47,190,0.15)',
            'transparent',
          ]}
          style={styles.orbTopLeft}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <LinearGradient
          colors={[
            isDark ? 'rgba(233,30,140,0.25)' : 'rgba(233,30,140,0.10)',
            'transparent',
          ]}
          style={styles.orbBottomRight}
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
              <Text style={styles.logoText}>DayLens</Text>
              <Text style={styles.logoSubtext}>Track your life. Live smarter.</Text>
            </View>

            {/* ── Welcome text ── */}
            <View style={styles.welcomeBlock}>
              <Text style={styles.welcomeTitle}>Welcome back</Text>
              <Text style={styles.welcomeSubtitle}>
                Sign in to continue your journey
              </Text>
            </View>

            {/* ── Email input ── */}
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

            {/* ── Password input ── */}
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

            {/* ── Forgot password ── */}
            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* ── Login button ── */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={authLoading}
              style={styles.gradientButtonOuter}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.gradientButtonText}>Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* ── Divider ── */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
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

            {/* ── Sign up link ── */}
            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.bottomLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AppLoader visible={authLoading} message="Signing in…" />
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
    orbTopLeft: {
      position: 'absolute',
      top: -width * 0.3,
      left: -width * 0.2,
      width: width * 0.9,
      height: width * 0.9,
      borderRadius: width * 0.45,
    },
    orbBottomRight: {
      position: 'absolute',
      bottom: -width * 0.25,
      right: -width * 0.15,
      width: width * 0.7,
      height: width * 0.7,
      borderRadius: width * 0.35,
    },

    /* ── Logo ── */
    logoContainer: {
      alignItems: 'center',
      marginBottom: Spacing['3xl'],
    },
    logoGradient: {
      width: 72,
      height: 72,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
      ...Shadow.accent,
    },
    logoEmoji: {
      fontSize: 34,
    },
    logoText: {
      ...(Typography.displayLG as any),
      color: c.textPrimary,
      fontWeight: '800',
    },
    logoSubtext: {
      ...(Typography.bodyMD as any),
      color: c.textSecondary,
      marginTop: Spacing.xs,
    },

    /* ── Welcome ── */
    welcomeBlock: {
      marginBottom: Spacing.xxl,
    },
    welcomeTitle: {
      ...(Typography.h1 as any),
      color: c.textPrimary,
      textAlign: 'center',
    },
    welcomeSubtitle: {
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

    /* ── Forgot ── */
    forgotButton: {
      alignSelf: 'flex-end',
      marginBottom: Spacing.xxl,
      marginTop: Spacing.xs,
    },
    forgotText: {
      ...(Typography.labelMD as any),
      color: c.accentPurple,
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
