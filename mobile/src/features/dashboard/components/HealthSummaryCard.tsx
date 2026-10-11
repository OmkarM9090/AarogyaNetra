/**
 * HealthSummaryCard — overall risk from /predictions/summary.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/components/ui/Card';
import { RiskGauge } from '../../prediction/components/RiskGauge';
import { Colors, Spacing, Typography } from '../../../shared/theme';
import type { RiskSummary } from '../../../shared/types/health';

interface HealthSummaryCardProps {
  summary: RiskSummary;
}

export const HealthSummaryCard: React.FC<HealthSummaryCardProps> = ({ summary }) => {
  const score = Math.round(summary.overallRiskScore);
  const level =
    score < 25 ? 'low' : score < 50 ? 'moderate' : score < 75 ? 'high' : 'critical';
  const color =
    level === 'low' ? Colors.success : level === 'moderate' ? Colors.warning : level === 'high' ? '#f97316' : Colors.danger;

  const interpretation =
    score < 25
      ? '🌟 Healthy profile — keep it up'
      : score < 50
        ? '👍 Minor attention needed'
        : score < 75
          ? '⚠️ Consult a physician'
          : '🚨 Elevated risk — seek medical advice';

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.row}>
        <RiskGauge score={score} size={110} strokeWidth={11} color={color} label="Overall risk" />
        <View style={styles.meta}>
          <Text style={[styles.interp, { color }]}>{interpretation}</Text>
          <Text style={styles.scansCount}>
            {summary.totalScans} scan{summary.totalScans === 1 ? '' : 's'} on record
          </Text>
          <Text style={styles.note}>⚕️ Educational screening — not a diagnosis</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  meta: {
    flex: 1,
    gap: Spacing.xs,
  },
  interp: {
    ...Typography.h4,
    fontWeight: '800',
  },
  scansCount: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  note: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
});
