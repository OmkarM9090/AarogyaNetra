/**
 * DiseaseCard — per-condition risk summary card (used on the results hub).
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Colors, Spacing, Typography } from '../../../shared/theme';
import { riskLevelColor, riskLevelLabel } from '../../../shared/utils/healthUtils';
import type { RiskLevel, VitalDisplay as VitalDisplayType } from '../../../shared/types/health';
import { RiskGauge } from './RiskGauge';

interface DiseaseCardProps {
  name: string;
  icon: string;
  riskLevel: RiskLevel;
  /** 0-100 */
  riskScore: number;
  confidence: number;
  keyMetric: VitalDisplayType;
  category?: string;
  onPress?: () => void;
}

export const DiseaseCard: React.FC<DiseaseCardProps> = ({
  name,
  icon,
  riskLevel,
  riskScore,
  confidence,
  keyMetric,
  category,
  onPress,
}) => {
  const riskColor = riskLevelColor(riskLevel);

  const card = (
    <Card style={styles.card} variant="elevated">
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.name, { color: riskColor }]}>{name}</Text>
      </View>

      <View style={styles.gaugeRow}>
        <RiskGauge score={riskScore} size={84} strokeWidth={8} color={riskColor} />
        <View style={styles.meta}>
          <Badge color={riskColor}>{riskLevelLabel(riskLevel)}</Badge>
          <Text style={styles.confidence}>Confidence {Math.round(confidence * 100)}%</Text>
          {category ? <Text style={styles.category}>{category}</Text> : null}
        </View>
      </View>

      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>{keyMetric.label}</Text>
        <View style={styles.metricValueRow}>
          <Text style={[styles.metricValue, { color: riskColor }]}>{keyMetric.value}</Text>
          <Text style={styles.metricUnit}>{keyMetric.unit}</Text>
        </View>
      </View>

      {onPress ? <Text style={styles.more}>View details →</Text> : null}
    </Card>
  );

  if (!onPress) return card;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.pressable, pressed && { opacity: 0.85 }]}>
      {card}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 240,
    gap: Spacing.sm,
  },
  pressable: {
    marginRight: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: {
    fontSize: 20,
  },
  name: {
    ...Typography.h4,
    fontWeight: '800',
  },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  meta: {
    gap: Spacing.xs,
  },
  confidence: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  category: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingTop: Spacing.sm,
  },
  metricLabel: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  metricValue: {
    ...Typography.h4,
    fontWeight: '800',
  },
  metricUnit: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  more: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
});
