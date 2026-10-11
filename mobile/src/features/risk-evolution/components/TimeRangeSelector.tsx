/**
 * TimeRangeSelector — 6 / 12 month horizon toggle.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '../../../shared/theme';
import type { DREMHorizon } from '../types';

interface TimeRangeSelectorProps {
  value: DREMHorizon;
  onChange: (h: DREMHorizon) => void;
}

const OPTIONS: { value: DREMHorizon; label: string }[] = [
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months' },
];

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ value, onChange }) => (
  <View style={styles.row}>
    {OPTIONS.map((o) => (
      <Pressable
        key={o.value}
        style={[styles.btn, value === o.value && styles.btnActive]}
        onPress={() => onChange(o.value)}
      >
        <Text style={[styles.btnText, value === o.value && styles.btnTextActive]}>{o.label}</Text>
      </Pressable>
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  btnActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  btnText: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  btnTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
});
