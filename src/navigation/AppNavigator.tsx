// ─────────────────────────────────────────────
//  AppNavigator · Bottom tab navigation
// ─────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';

import HomeScreen     from '../screens/HomeScreen';
import InsightsScreen from '../screens/InsightsScreen';
import HistoryScreen  from '../screens/HistoryScreen';
import SpendingScreen from '../screens/SpendingScreen';
import { Typography } from '../constants';
import { useApp } from '../context/AppContext';

// ── Navigation type ───────────────────────────
export type RootTabParamList = {
  Home:     undefined;
  Spending: undefined;
  Insights: undefined;
  History:  undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

// ── Tab icon ──────────────────────────────────
interface TabIconProps {
  emoji:   string;
  label:   string;
  focused: boolean;
}

function TabIcon({ emoji, label, focused }: TabIconProps) {
  const { colors } = useApp();
  return (
    <View style={[iconStyles.container, focused && iconStyles.focused]}>
      {focused ? (
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={iconStyles.activePill}
        >
          <Text style={iconStyles.emoji}>{emoji}</Text>
        </LinearGradient>
      ) : (
        <Text style={[iconStyles.emoji, iconStyles.inactiveEmoji]}>{emoji}</Text>
      )}
    </View>
  );
}

// ── Navigator ────────────────────────────────
export default function AppNavigator() {
  const { colors } = useApp();

  const tabBarStyle = {
    backgroundColor: colors.tabBar,
    borderTopColor:  colors.divider,
    borderTopWidth:  0.5,
    height:          Platform.OS === 'ios' ? 82 : 66,
    paddingBottom:   Platform.OS === 'ios' ? 22 : 10,
    paddingTop:      10,
    elevation:       0,
    shadowOpacity:   0,
  };

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown:             false,
        tabBarStyle:             tabBarStyle,
        tabBarShowLabel:         true,
        tabBarActiveTintColor:   colors.accentPurple,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle:        tabLabelStyle,
        tabBarItemStyle:         tabItemStyle,
        tabBarBackground:        () => (
          <View style={{ flex: 1, backgroundColor: colors.tabBar }} />
        ),
      }}
    >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Today',
            tabBarIcon:  ({ focused }) => (
              <TabIcon emoji="⚡" label="Today" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Spending"
          component={SpendingScreen}
          options={{
            tabBarLabel: 'Spending',
            tabBarIcon:  ({ focused }) => (
              <TabIcon emoji="💳" label="Spending" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Insights"
          component={InsightsScreen}
          options={{
            tabBarLabel: 'AI Insight',
            tabBarIcon:  ({ focused }) => (
              <TabIcon emoji="🧠" label="AI Insight" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            tabBarLabel: 'History',
            tabBarIcon:  ({ focused }) => (
              <TabIcon emoji="📅" label="History" focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
  );
}

// ── Stable styles (no color refs) ────────────

const tabLabelStyle = {
  ...Typography.labelSM,
  fontSize:      10,
  letterSpacing: 0.5,
  marginTop:     2,
};

const tabItemStyle = {
  paddingTop: 4,
};

const iconStyles = StyleSheet.create({
  container: {
    alignItems:     'center',
    justifyContent: 'center',
    width:          40,
    height:         32,
    borderRadius:   10,
  },
  focused: {},
  activePill: {
    width:          40,
    height:         32,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 19,
  },
  inactiveEmoji: {
    opacity: 0.45,
  },
});
