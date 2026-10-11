/**
 * ScanHistoryItem — one row in the history list.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '../../../shared/theme';
import { CONDITION_META } from '../../../shared/utils/healthUtils';
import { formatDateTime } from '../../../shared/utils/dateUtils';
import type { ScanRecord } from '../../../shared/types/scan';

interface ScanHistoryItemProps {
  scan: ScanRecord;
  onPress: (scan: ScanRecord) => void;
}

export const ScanHistoryItem: React.FC<ScanHistoryItemProps> = ({ scan, onPress }) => {
  const meta = CONDITION_META[scan.scanType];
  const pred = scan.prediction;
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
      onPress={() => onPress(scan)}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${meta.color}12` }]}>
        <Text style={styles.icon}>{meta.icon}</Text>
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>{meta.label} scan</Text>
        <Text style={styles.when}>{formatDateTime(scan.createdAt)}</Text>
        <View style={styles.tagsRow}>
          {pred ? (
            <>
              <View style={[styles.tag, { backgroundColor: `${meta.color}15` }]}>
                <Text style={[styles.tagText, { color: meta.color }]}>
                  {Math.round(pred.riskScore)}% · {pred.riskLevel}
                </Text>
              </View>
              <View style={[styles.tag, { backgroundColor: Colors.surfaceContainerLow }]}>
                <Text style={[styles.tagText, { color: Colors.textTertiary }]}>
                  confidence {Math.round(pred.confidence * 100)}%
                </Text>
              </View>
            </>
          ) : (
            <View style={[styles.tag, { backgroundColor: Colors.surfaceContainerLow }]}>
              <Text style={[styles.tagText, { color: Colors.textTertiary }]}>{scan.status}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.chevron}>→</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  textCol: {
    flex: 1,
    gap: 3,
  },
  title: {
    ...Typography.bodySmall,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  when: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  chevron: {
    color: Colors.textTertiary,
    fontSize: 18,
    fontWeight: '700',
  },
});
