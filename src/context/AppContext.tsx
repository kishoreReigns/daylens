// ─────────────────────────────────────────────
//  AppContext · Theme + Drawer state
// ─────────────────────────────────────────────
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from 'react';
import { Animated, Dimensions } from 'react-native';

import { Colors, LightColors } from '../constants/colors';
import type { ColorPalette } from '../constants/colors';

export const DRAWER_WIDTH = Math.min(
  Math.floor(Dimensions.get('window').width * 0.78),
  310,
);

export type Theme = 'dark' | 'light';

export interface AppContextValue {
  theme:            Theme;
  isDark:           boolean;
  toggleTheme:      () => void;
  colors:           ColorPalette;
  openDrawer:       () => void;
  closeDrawer:      () => void;
  drawerX:          Animated.Value;
  drawerVisible:    boolean;
  drawerWidth:      number;
  isAuthenticated:  boolean;
  login:            () => void;
  logout:           () => void;
}

// Stable default so createContext never needs an undefined check
const _stub = new Animated.Value(-DRAWER_WIDTH);

const AppContext = createContext<AppContextValue>({
  theme:            'dark',
  isDark:           true,
  toggleTheme:      () => {},
  colors:           Colors,
  openDrawer:       () => {},
  closeDrawer:      () => {},
  drawerX:          _stub,
  drawerVisible:    false,
  drawerWidth:      DRAWER_WIDTH,
  isAuthenticated:  false,
  login:            () => {},
  logout:           () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme,            setTheme]            = useState<Theme>('dark');
  const [drawerVisible,    setDrawerVisible]    = useState(false);
  const [isAuthenticated,  setIsAuthenticated]  = useState(false);
  const drawerX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  const openDrawer = useCallback(() => {
    setDrawerVisible(true);
    Animated.spring(drawerX, {
      toValue:         0,
      useNativeDriver: true,
      damping:         22,
      stiffness:       200,
      mass:            0.8,
    }).start();
  }, [drawerX]);

  const closeDrawer = useCallback(() => {
    Animated.spring(drawerX, {
      toValue:         -DRAWER_WIDTH,
      useNativeDriver: true,
      damping:         22,
      stiffness:       200,
      mass:            0.8,
    }).start(() => setDrawerVisible(false));
  }, [drawerX]);

  const toggleTheme = useCallback(
    () => setTheme((p) => (p === 'dark' ? 'light' : 'dark')),
    [],
  );

  const colors: ColorPalette = theme === 'dark' ? Colors : LightColors;

  const login  = useCallback(() => setIsAuthenticated(true), []);
  const logout = useCallback(() => setIsAuthenticated(false), []);

  return (
    <AppContext.Provider
      value={{
        theme,
        isDark:           theme === 'dark',
        toggleTheme,
        colors,
        openDrawer,
        closeDrawer,
        drawerX,
        drawerVisible,
        drawerWidth:      DRAWER_WIDTH,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  return useContext(AppContext);
}
