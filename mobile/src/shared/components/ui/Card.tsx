/**
 * Card — tonal-layered surface (no borders, soft ambient shadow).
 */
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors, Spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'accent';
  padding?: number;
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default', padding }) => {
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
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: Spacing.lg,
  },
});
