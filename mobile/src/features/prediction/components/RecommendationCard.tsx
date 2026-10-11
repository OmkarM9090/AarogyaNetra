/**
 * RecommendationCard — one personalized recommendation from the backend.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/components/ui/Card';
import { Colors, Spacing, Typography } from '../../../shared/theme';
import type { Recommendation } from '../../../shared/types/health';

interface RecommendationCardProps {
  recommendation: Recommendation;
  index?: number;
}

const PRIORITY_META: Record<Recommendation['priority'], { icon: string; label: string; color: string }> = {
  urgent: { icon: '🔴', label: 'Urgent', color: Colors.danger },
  moderate: { icon: '🟠', label: 'Important', color: Colors.warning },
  info: { icon: '🔵', label: 'Advisory', color: Colors.secondary },
};

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation, index = 0 }) => {
  const meta = PRIORITY_META[recommendation.priority] ?? PRIORITY_META.info;
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{meta.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{recommendation.title}</Text>
          <Text style={styles.category}>{recommendation.category}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: `${meta.color}15`, borderColor: `${meta.color}45` }]}>
          <Text style={[styles.pillText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>
      <Text style={styles.desc}>{recommendation.description}</Text>
      {index < 0 ? null : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  icon: {
    fontSize: 18,
  },
  title: {
    ...Typography.body,
    fontWeight: '800',
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  category: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  pillText: {
    ...Typography.caption,
    fontWeight: '800',
  },
  desc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
