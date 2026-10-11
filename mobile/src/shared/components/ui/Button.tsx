/**
 * Button — premium CTA button with press animation and loading state.
 */
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';

import { Colors, Shadow, Spacing, Typography } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}) => {
  const variantStyle: ViewStyle = (() => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: Colors.primary, borderColor: Colors.primary };
      case 'secondary':
        return { backgroundColor: Colors.secondary, borderColor: Colors.secondary };
      case 'outline':
        return { backgroundColor: 'transparent', borderColor: Colors.primary, borderWidth: 1.5 };
      case 'ghost':
        return { backgroundColor: 'transparent', borderColor: 'transparent' };
      case 'danger':
        return { backgroundColor: Colors.danger, borderColor: Colors.danger };
    }
  })();

  const textColor = variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.white;

  const sizeStyle: ViewStyle = (() => {
    switch (size) {
      case 'small':
        return { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderRadius: Spacing.md };
      case 'large':
        return { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, borderRadius: Spacing.xl };
      default:
        return { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: Spacing.md };
    }
  })();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        variantStyle,
        sizeStyle,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        variant === 'primary' && Shadow.small,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.label, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: {
    flexDirection: 'row',
  },
  label: {
    ...Typography.body,
    fontWeight: '700',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
