/**
 * LoadingSpinner — centered branded loader.
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '../../theme';

interface LoadingSpinnerProps {
  label?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ label, fullScreen = false }) => (
  <View style={[styles.wrap, fullScreen && styles.fullScreen]}>
    <ActivityIndicator size="large" color={Colors.primary} />
    {label ? <Text style={styles.label}>{label}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
});
