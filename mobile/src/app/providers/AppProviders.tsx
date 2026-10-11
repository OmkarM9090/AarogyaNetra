/**
 * AppProviders — the full provider stack, in order:
 *
 *   GestureHandlerRootView
 *     SafeAreaProvider
 *       ThemeProvider
 *         LanguageProvider (reads language from the app store)
 *           ToastProvider
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LanguageProvider } from '../../shared/i18n';
import { useAppStore } from '../../shared/store/useAppStore';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useHealthStore } from '../../shared/store/useHealthStore';
import { ThemeProvider } from './ThemeProvider';
import { ToastProvider } from '../../shared/components/feedback/Toast';
import { Colors } from '../../shared/theme';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const language = useAppStore(s => s.language);
  const loadData = useAppStore(s => s.loadData);
  const checkAuth = useAuthStore(s => s.checkAuth);
  const loadCached = useHealthStore(s => s.loadCached);

  useEffect(() => {
    // Startup sequence:
    //  a. read persisted app data (language, disclaimer)
    //  b. validate stored auth tokens via GET /auth/me
    //  c. preload cached health data so screens render instantly
    void loadData();
    void loadCached();
    void checkAuth();
  }, [loadData, loadCached, checkAuth]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider language={language}>
            <ToastProvider>
              <View style={styles.container}>{children}</View>
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = {
  root: { flex: 1 } as const,
  container: { flex: 1, backgroundColor: Colors.background } as const,
};
