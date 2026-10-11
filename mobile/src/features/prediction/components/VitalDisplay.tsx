/**
 * VitalDisplay — compact key-metric pill (e.g. "BP 130/85 mmHg").
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '../../../shared/theme';

interface VitalDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
}

export const VitalDisplay: React.FC<VitalDisplayProps> = ({ label, value, unit, color = Colors.primary }) => (
  <View style={[styles.pill, { borderColor: `${color}33` }]}>
    <Text style={[styles.label, { color: `${color}cc` }]}>{label}</Text>
    <View style={styles.valueRow}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {unit ? <Text style={styles.unit}>{unit}</Text> : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  pill: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    minWidth: 92,
  },
  label: {
    ...Typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  value: {
    ...Typography.h4,
    fontWeight: '800',
  },
  unit: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
});
