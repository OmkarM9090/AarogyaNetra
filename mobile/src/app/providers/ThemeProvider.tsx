/**
 * ThemeProvider — exposes the app theme + manages the status bar.
 * (The theme is static light "Empathetic Guardian"; the provider exists so
 * dark mode can be layered on without touching call sites.)
 */
import React from 'react';
import { StatusBar } from 'react-native';

import { Colors } from '../../shared/theme';

interface ThemeContextValue {
  colors: typeof Colors;
  isDark: boolean;
}

export const ThemeContext = React.createContext<ThemeContextValue>({
  colors: Colors,
  isDark: false,
});

export function useTheme() {
  return React.useContext(ThemeContext);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeContext.Provider value={{ colors: Colors, isDark: false }}>
    <StatusBar barStyle="dark-content" backgroundColor={Colors.background} translucent={false} />
    {children}
  </ThemeContext.Provider>
);
