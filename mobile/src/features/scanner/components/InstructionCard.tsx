/**
 * InstructionCard — numbered steps card used across scanner screens.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/components/ui/Card';
import { Colors, Spacing, Typography } from '../../../shared/theme';

interface InstructionCardProps {
  title: string;
  steps: string[];
  color?: string;
}

export const InstructionCard: React.FC<InstructionCardProps> = ({ title, steps, color = Colors.primary }) => (
  <Card style={styles.card}>
    <Text style={[styles.title, { color }]}>{title}</Text>
    <View style={styles.list}>
      {steps.map((s, i) => (
        <Text key={i} style={styles.step}>
          {i + 1}️⃣  {s}
        </Text>
      ))}
    </View>
  </Card>
);

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
  },
  title: {
    ...Typography.h4,
    fontWeight: '700',
  },
  list: {
    gap: Spacing.xs,
  },
  step: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
