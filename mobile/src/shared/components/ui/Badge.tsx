/**
 * Badge — small status pill.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '../../theme';

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  /** When true, renders a filled pill; otherwise a tinted one. */
  filled?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ children, color = Colors.primary, filled = false }) => (
  <View
    style={[
      styles.badge,
      {
        backgroundColor: filled ? color : `${color}15`,
        borderColor: filled ? color : `${color}40`,
      },
    ]}
  >
    <Text style={[styles.text, { color: filled ? '#fff' : color }]}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xxs,
  },
  text: {
    ...Typography.caption,
    fontWeight: '700',
  },
});
