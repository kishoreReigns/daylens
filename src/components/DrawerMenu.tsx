// ─────────────────────────────────────────────
//  DrawerMenu · Slide-in side drawer
//  No extra packages — pure Animated.Value
// ─────────────────────────────────────────────
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  TouchableOpacity,
  Linking,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useApp } from '../context/AppContext';
import { Typography, Radii } from '../constants';

export default function DrawerMenu() {
  const {
    drawerX,
    drawerVisible,
    drawerWidth,
    closeDrawer,
    colors,
    isDark,
    toggleTheme,
    logout,
  } = useApp();

  const insets = useSafeAreaInsets();

  if (!drawerVisible) return null;

  // Overlay opacity fades in sync with the drawer translate
  const overlayOpacity = drawerX.interpolate({
    inputRange:  [-drawerWidth, 0],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* ── Dimmed backdrop ─────────────────── */}
      <Pressable
        style={StyleSheet.absoluteFillObject}
        onPress={closeDrawer}
        pointerEvents="auto"
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: 'rgba(0,0,0,0.52)', opacity: overlayOpacity },
          ]}
        />
      </Pressable>

      {/* ── Drawer panel ────────────────────── */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width:           drawerWidth,
            backgroundColor: colors.card,
            paddingTop:      insets.top + 20,
            paddingBottom:   insets.bottom + 24,
            transform:       [{ translateX: drawerX }],
          },
        ]}
      >
        {/* Subtle gradient wash on the panel */}
        <LinearGradient
          colors={['rgba(139,92,246,0.14)', 'rgba(236,72,153,0.06)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {/* ── App identity ──────────────────── */}
        <View style={styles.header}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.appLogo}
          >
            <Text style={styles.appLogoText}>D</Text>
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={[styles.appName, { color: colors.textPrimary }]}>
              DayLens AI
            </Text>
            <Text style={[styles.appTagline, { color: colors.textTertiary }]}>
              Life Activity Tracker
            </Text>
          </View>
        </View>

        {/* ── Divider ───────────────────────── */}
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        {/* ── Menu items ────────────────────── */}
        <View style={styles.menuSection}>
          {/* Mail Us */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              { backgroundColor: isDark ? 'rgba(56,189,248,0.08)' : 'rgba(56,189,248,0.07)' },
            ]}
            onPress={() => Linking.openURL('mailto:hello@daylens.app')}
            activeOpacity={0.75}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBubble, { backgroundColor: 'rgba(56,189,248,0.15)' }]}>
                <Text style={styles.menuEmoji}>✉️</Text>
              </View>
              <View>
                <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                  Mail Us
                </Text>
                <Text style={[styles.menuSub, { color: colors.textTertiary }]}>
                  hello@daylens.app
                </Text>
              </View>
            </View>
            <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Divider ───────────────────────── */}
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        {/* ── Appearance toggle ─────────────── */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
            APPEARANCE
          </Text>

          <TouchableOpacity
            style={[
              styles.menuItem,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
            ]}
            onPress={toggleTheme}
            activeOpacity={0.85}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBubble, { backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : 'rgba(245,158,11,0.15)' }]}>
                <Text style={styles.menuEmoji}>{isDark ? '🌙' : '☀️'}</Text>
              </View>
              <View>
                <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </Text>
                <Text style={[styles.menuSub, { color: colors.textTertiary }]}>
                  Tap to switch
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D1C9EE', true: colors.accentPurple }}
              thumbColor={isDark ? '#FFFFFF' : colors.accentPurple}
              ios_backgroundColor={isDark ? '#332E55' : '#D1C9EE'}
            />
          </TouchableOpacity>
        </View>

        {/* ── Divider ───────────────────────── */}
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        {/* ── Sign out ──────────────────────── */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={[
              styles.menuItem,
              { backgroundColor: isDark ? 'rgba(244,63,94,0.08)' : 'rgba(244,63,94,0.06)' },
            ]}
            onPress={() => {
              closeDrawer();
              setTimeout(() => logout(), 300);
            }}
            activeOpacity={0.75}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBubble, { backgroundColor: 'rgba(244,63,94,0.15)' }]}>
                <Text style={styles.menuEmoji}>🚪</Text>
              </View>
              <View>
                <Text style={[styles.menuLabel, { color: colors.negative }]}>
                  Sign Out
                </Text>
                <Text style={[styles.menuSub, { color: colors.textTertiary }]}>
                  See you later
                </Text>
              </View>
            </View>
            <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Version footer ────────────────── */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            v1.0.0 · DayLens AI
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position:                  'absolute',
    top:                        0,
    left:                       0,
    bottom:                     0,
    borderTopRightRadius:      24,
    borderBottomRightRadius:   24,
    overflow:                  'hidden',
    elevation:                  24,
    shadowColor:               '#000',
    shadowOffset:              { width: 10, height: 0 },
    shadowOpacity:              0.40,
    shadowRadius:               28,
    zIndex:                     999,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               14,
    paddingHorizontal: 20,
    paddingBottom:     20,
  },
  appLogo: {
    width:          50,
    height:         50,
    borderRadius:   15,
    alignItems:     'center',
    justifyContent: 'center',
  },
  appLogoText: {
    fontSize:   26,
    fontWeight: '800',
    color:      '#FFFFFF',
  },
  headerText: {
    flex: 1,
  },
  appName: {
    fontSize:      17,
    fontWeight:    '700',
    letterSpacing: 0.2,
  },
  appTagline: {
    fontSize:  12,
    marginTop: 2,
  },
  divider: {
    height:            1,
    marginHorizontal:  20,
    marginVertical:    14,
  },
  menuSection: {
    paddingHorizontal: 12,
    gap:               8,
  },
  sectionLabel: {
    fontSize:      10,
    fontWeight:    '700',
    letterSpacing: 1.2,
    paddingHorizontal: 4,
    marginBottom:  4,
  },
  menuItem: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 14,
    paddingVertical:   13,
    borderRadius:      14,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  iconBubble: {
    width:          40,
    height:         40,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
  },
  menuEmoji: {
    fontSize: 18,
  },
  menuLabel: {
    fontSize:   15,
    fontWeight: '600',
  },
  menuSub: {
    fontSize:  12,
    marginTop:  2,
  },
  chevron: {
    fontSize:   20,
    lineHeight: 22,
  },
  footer: {
    position:  'absolute',
    bottom:    20,
    left:       0,
    right:      0,
    alignItems:'center',
  },
  footerText: {
    fontSize: 11,
  },
});
