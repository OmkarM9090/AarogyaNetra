/**
 * ImpactChart — before/after bars per condition with delta badges.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Colors, Spacing, Typography } from '../../../shared/theme';
import { CONDITION_META } from '../../../shared/utils/healthUtils';
import type { Condition } from '../../../shared/types/health';
import type { WhatIfResult } from '../services/whatIfEngine';

interface ImpactChartProps {
  baseline: Record<Condition, number>;
  result: WhatIfResult;
}

const BAR_MAX = 100;

export const ImpactChart: React.FC<ImpactChartProps> = ({ baseline, result }) => (
  <Card style={styles.card}>
    <Text style={styles.title}>📉 Projected impact</Text>
    {(['diabetes', 'hypertension', 'anemia'] as Condition[]).map((cond) => {
      const before = Math.round(baseline[cond]);
      const after = Math.round(result.modifiedRisks[cond]);
      const delta = Math.round(result.deltas[cond]);
      const meta = CONDITION_META[cond];
      return (
        <View key={cond} style={styles.row}>
          <View style={styles.labelCol}>
            <Text style={styles.label}>
              {meta.icon} {meta.label}
            </Text>
            {delta !== 0 ? (
              <Badge color={delta < 0 ? Colors.success : Colors.danger}>
                {delta > 0 ? `+${delta}` : delta} pts
              </Badge>
            ) : (
              <Badge color={Colors.textTertiary}>no change</Badge>
            )}
          </View>
          <View style={styles.barsCol}>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { width: `${(before / BAR_MAX) * 100}%`, backgroundColor: `${meta.color}55` }]} />
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { width: `${(after / BAR_MAX) * 100}%`, backgroundColor: meta.color }]} />
            </View>
            <View style={styles.barValues}>
              <Text style={styles.barValue}>{before}%</Text>
              <Text style={[styles.barValue, { color: meta.color, fontWeight: '800' }]}>{after}%</Text>
            </View>
          </View>
        </View>
      );
    })}
    <View style={styles.legend}>
      <View style={[styles.legendLine, { backgroundColor: Colors.surfaceContainerHigh }]} />
      <Text style={styles.legendText}>Now (real screening)</Text>
      <View style={[styles.legendLine, { backgroundColor: Colors.primary }]} />
      <Text style={styles.legendText}>After your changes</Text>
    </View>
  </Card>
);

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  title: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  row: {
    gap: Spacing.xs,
  },
  labelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  barsCol: {
    gap: 4,
  },
  barTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.surfaceContainerLow,
    overflow: 'hidden',
  },
  bar: {
    height: 10,
    borderRadius: 5,
  },
  barValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barValue: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  legendLine: {
    width: 16,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginRight: Spacing.sm,
  },
});
