/**
 * RiskFactorList — top model feature contributions (if provided by the model).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/components/ui/Card';
import { Colors, Spacing, Typography } from '../../../shared/theme';
import type { FeatureImportance } from '../../../shared/types/health';

interface RiskFactorListProps {
  title: string;
  factors: FeatureImportance[];
  color?: string;
}

export const RiskFactorList: React.FC<RiskFactorListProps> = ({ title, factors, color = Colors.primary }) => {
  if (!factors || factors.length === 0) return null;
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {factors.map((f, i) => {
        const pct = Math.max(2, Math.min(100, Math.round((f.contribution ?? 0) * 100)));
        return (
          <View key={`${f.feature}-${i}`} style={styles.row}>
            <View style={styles.textCol}>
              <Text style={styles.factorName}>{f.feature}</Text>
              {f.description ? <Text style={styles.factorDesc}>{f.description}</Text> : null}
            </View>
            <View style={styles.barCol}>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
              </View>
              <Text style={[styles.pct, { color }]}>{pct}%</Text>
            </View>
          </View>
        );
      })}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
  },
  title: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  textCol: {
    flex: 1,
  },
  factorName: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  factorDesc: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  barCol: {
    width: 96,
    gap: 3,
    alignItems: 'flex-end',
  },
  track: {
    alignSelf: 'stretch',
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceContainerLow,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
  pct: {
    ...Typography.caption,
    fontWeight: '700',
  },
});
