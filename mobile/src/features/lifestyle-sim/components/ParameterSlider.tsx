/**
 * ParameterSlider — one lifestyle parameter with live value.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';

import { Colors, Spacing, Typography } from '../../../shared/theme';

interface ParameterSliderProps {
  label: string;
  icon: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}

export const ParameterSlider: React.FC<ParameterSliderProps> = ({
  label,
  icon,
  value,
  min,
  max,
  unit,
  onChange,
}) => (
  <View style={styles.wrap}>
    <View style={styles.header}>
      <Text style={styles.label}>
        {icon} {label}
      </Text>
      <Text style={styles.value}>
        {value}
        <Text style={styles.unit}> {unit}</Text>
      </Text>
    </View>
    <Slider
      minimumValue={min}
      maximumValue={max}
      value={value}
      onValueChange={onChange}
      minimumTrackTintColor={Colors.primary}
      maximumTrackTintColor={Colors.surfaceContainerHigh}
      thumbTintColor={Colors.primary}
    />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  value: {
    ...Typography.bodySmall,
    fontWeight: '800',
    color: Colors.primary,
  },
  unit: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
});
