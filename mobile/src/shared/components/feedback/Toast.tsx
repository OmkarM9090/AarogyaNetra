/**
 * Toast — lightweight toast notifications (no native dependency).
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success('Scan complete');
 *   toast.error('Cannot connect to server.');
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '../../theme';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  show: () => undefined,
  success: () => undefined,
  error: () => undefined,
  info: () => undefined,
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const animsRef = useRef<Map<number, Animated.Value>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = ++idRef.current;
      const opacity = new Animated.Value(0);
      animsRef.current.set(id, opacity);
      setToasts(prev => [...prev.slice(-2), { id, kind, message }]);
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      setTimeout(() => {
        const a = animsRef.current.get(id);
        if (a) {
          Animated.timing(a, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => dismiss(id));
        } else {
          dismiss(id);
        }
      }, 3500);
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
    info: (m) => show(m, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={styles.overlay} pointerEvents="box-none">
        {toasts.map((t) => {
          const opacity = animsRef.current.get(t.id);
          const meta =
            t.kind === 'success'
              ? { icon: '✅', color: Colors.success }
              : t.kind === 'error'
                ? { icon: '️', color: Colors.danger }
                : { icon: 'ℹ️', color: Colors.secondary };
          return (
            <Animated.View
              key={t.id}
              style={[styles.toast, { borderColor: `${meta.color}55`, opacity: opacity ?? 1 }]}
            >
              <Text style={styles.icon}>{meta.icon}</Text>
              <Text style={styles.message} numberOfLines={3}>{t.message}</Text>
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 60,
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    alignSelf: 'stretch',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  icon: {
    fontSize: 16,
  },
  message: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 19,
  },
});
