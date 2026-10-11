/**
 * RiskChart — one condition's trajectory card: title, graph, current vs
 * projected stats.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/components/ui/Card';
import { Colors, Spacing, Typography } from '../../../shared/theme';
import type { TrajectoryData } from '../types';
import { TrajectoryGraph } from './TrajectoryGraph';

interface RiskChartProps {
  title: string;
  icon: string;
  color: string;
  data: TrajectoryData;
}

export const RiskChart: React.FC<RiskChartProps> = ({ title, icon, color, data }) => {
  const current = Math.round(data.median[0] ?? 0);
  const projected = Math.round(data.median[data.median.length - 1] ?? 0);
  const change = projected - current;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.title, { color }]}>{title}</Text>
      </View>

      <TrajectoryGraph data={data} color={color} />

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Current</Text>
          <Text style={[styles.statValue, { color }]}>{current}%</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Projected</Text>
          <Text style={[styles.statValue, { color }]}>{projected}%</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Change</Text>
          <Text style={[styles.statValue, { color: change <= 0 ? Colors.success : Colors.danger }]}>
            {change > 0 ? `+${change}` : change} pts
          </Text>
        </View>
      </View>

      <View style={styles.legendRow}>
        <View style={[styles.legendLine, { backgroundColor: color }]} />
        <Text style={styles.legendLabel}>Median trajectory</Text>
        <View style={[styles.legendLine, { backgroundColor: `${color}40` }]} />
        <Text style={styles.legendLabel}>5–95% range</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  icon: {
    fontSize: 18,
  },
  title: {
    ...Typography.h4,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.xs,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  statValue: {
    ...Typography.h4,
    fontWeight: '800',
  },
  arrow: {
    fontSize: 18,
    color: Colors.textTertiary,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  legendLine: {
    width: 18,
    height: 3,
    borderRadius: 2,
  },
  legendLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
});
