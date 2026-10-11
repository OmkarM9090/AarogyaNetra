/**
 * RecentScansWidget — compact list of the latest scans.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/components/ui/Card';
import { Colors, Spacing, Typography } from '../../../shared/theme';
import { timeAgo } from '../../../shared/utils/dateUtils';
import { CONDITION_META } from '../../../shared/utils/healthUtils';
import type { ScanRecord } from '../../../shared/types/scan';

interface RecentScansWidgetProps {
  scans: ScanRecord[];
  onOpen: (scanId: string) => void;
}

export const RecentScansWidget: React.FC<RecentScansWidgetProps> = ({ scans, onOpen }) => {
  if (scans.length === 0) return null;
  const recent = scans.slice(0, 3);

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>📊 Recent scans</Text>
      {recent.map((scan) => {
        const meta = CONDITION_META[scan.scanType];
        const pred = scan.prediction;
        return (
          <Pressable key={scan.id} style={styles.row} onPress={() => onOpen(scan.id)}>
            <Text style={styles.rowIcon}>{meta.icon}</Text>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{meta.label}</Text>
              <Text style={styles.rowWhen}>{timeAgo(scan.createdAt)}</Text>
            </View>
            {pred ? (
              <View style={[styles.scorePill, { backgroundColor: `${meta.color}15` }]}>
                <Text style={[styles.scoreText, { color: meta.color }]}>
                  {Math.round(pred.riskScore)}% {pred.riskLevel}
                </Text>
              </View>
            ) : (
              <Text style={styles.statusText}>{scan.status}</Text>
            )}
          </Pressable>
        );
      })}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: Spacing.xs,
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
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  rowIcon: {
    fontSize: 20,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  rowWhen: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  scorePill: {
    borderRadius: 999,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
  },
  scoreText: {
    ...Typography.caption,
    fontWeight: '800',
  },
  statusText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textTransform: 'capitalize',
  },
});
