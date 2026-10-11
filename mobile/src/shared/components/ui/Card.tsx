/**
 * Card — tonal-layered surface (no borders, soft ambient shadow).
 *
 * Primitive (string/number) children are wrapped in <Text> defensively —
 * RN crashes when a string lands directly inside a <View>.
 */
import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Colors, Spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'accent';
  padding?: number;
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default', padding }) => {
  const content =
    typeof children === 'string' || typeof children === 'number' ? <Text>{children}</Text> : children;
  const variantStyles: Record<string, ViewStyle> = {
    default: {
      backgroundColor: Colors.surfaceContainerLow,
    },
    elevated: {
      backgroundColor: Colors.surface,
      elevation: 2,
      shadowColor: '#191c1d',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.06,
      shadowRadius: 32,
    },
    accent: {
      backgroundColor: `${Colors.primary}08`,
    },
  };

  return (
    <View
      style={[
        styles.card,
        variantStyles[variant],
        padding !== undefined && { padding },
        style,
      ]}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: Spacing.lg,
  },
});
