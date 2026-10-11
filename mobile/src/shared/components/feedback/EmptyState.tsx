/**
 * EmptyState — friendly placeholder for empty lists.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '../../theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <View style={styles.wrap}>
    <Text style={styles.icon}>{icon}</Text>
    <Text style={styles.title}>{title}</Text>
    {description ? <Text style={styles.desc}>{description}</Text> : null}
    {action}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.xxl,
  },
  icon: {
    fontSize: 44,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  desc: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 19,
  },
});
