// ─────────────────────────────────────────────
//  DayLens AI · App Entry Point
// ─────────────────────────────────────────────
import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { Theme } from '@react-navigation/native';

import AppNavigator           from './src/navigation/AppNavigator';
import AuthNavigator          from './src/navigation/AuthNavigator';
import AddExpenseScreen       from './src/screens/AddExpenseScreen';
import QuickAddScreen         from './src/screens/QuickAddScreen';
import ScreenTimeScreen       from './src/screens/ScreenTimeScreen';
import DrawerMenu             from './src/components/DrawerMenu';
import { AppProvider, useApp }  from './src/context/AppContext';
import { SpendingProvider }     from './src/context/SpendingContext';
import { AuthProvider }         from './src/context/AuthContext';
import { ToastProvider }        from './src/context/ToastContext';

// Root stack wrapping tabs + modal screens
export type RootStackParamList = {
  Main:       undefined;
  AddExpense: undefined;
  QuickAdd:   undefined;
  ScreenTime: undefined;
};
const RootStack = createNativeStackNavigator<RootStackParamList>();

// Inner shell — lives inside providers so it can read context
function AppShell() {
  const { colors, isDark, isAuthenticated } = useApp();

  const navTheme: Theme = {
    ...DefaultTheme,
    dark: isDark,
    colors: {
      ...DefaultTheme.colors,
      background:   colors.background,
      card:         colors.tabBar,
      border:       colors.divider,
      primary:      colors.accentPurple,
      notification: colors.accentPurple,
      text:         colors.textPrimary,
    },
  };

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar
          style={isDark ? 'light' : 'dark'}
          backgroundColor={colors.background}
        />
        <NavigationContainer theme={navTheme}>
          {isAuthenticated ? (
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
              <RootStack.Screen name="Main" component={AppNavigator} />
              <RootStack.Screen
                name="AddExpense"
                component={AddExpenseScreen}
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
              <RootStack.Screen
                name="QuickAdd"
                component={QuickAddScreen}
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
              <RootStack.Screen
                name="ScreenTime"
                component={ScreenTimeScreen}
                options={{ presentation: 'card', animation: 'slide_from_right' }}
              />
            </RootStack.Navigator>
          ) : (
            <AuthNavigator />
          )}
        </NavigationContainer>
      </View>
      {/* Drawer rendered above navigation (only when authenticated) */}
      {isAuthenticated && <DrawerMenu />}
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <SpendingProvider>
          <ToastProvider>
            <AppShell />
          </ToastProvider>
        </SpendingProvider>
      </AppProvider>
    </AuthProvider>
  );
}
