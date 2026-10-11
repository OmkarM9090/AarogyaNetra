/**
 * Input — labeled text input with error display.
 */
import React from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Colors, Spacing, Typography } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, hint, icon, style, ...rest }) => (
  <View style={styles.wrap}>
    {label ? (
      <Text style={styles.label}>
        {icon ? `${icon} ` : ''}
        {label}
      </Text>
    ) : null}
    <TextInput
      placeholderTextColor={Colors.textTertiary}
      style={[styles.input, error && styles.inputError, style]}
      {...rest}
    />
    {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  error: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
  hint: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
});
