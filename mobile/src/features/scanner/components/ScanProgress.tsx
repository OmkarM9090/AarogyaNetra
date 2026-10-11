/**
 * ScanProgress — animated processing steps shown while the backend runs.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '../../../shared/theme';

interface ScanProgressProps {
  steps: string[];
  /** When provided, the steps advance automatically at this interval (ms). */
  autoAdvanceMs?: number;
}

export const ScanProgress: React.FC<ScanProgressProps> = ({ steps, autoAdvanceMs }) => {
  const spin = useRef(new Animated.Value(0)).current;
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 2600, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    if (!autoAdvanceMs) return;
    let step = 0;
    const iv = setInterval(() => {
      step += 1;
      if (step < steps.length) setActiveStep(step);
      else clearInterval(iv);
    }, autoAdvanceMs);
    return () => clearInterval(iv);
  }, [autoAdvanceMs, steps.length]);

  const spinValue = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ring, { transform: [{ rotate: spinValue }] }]}>
        <Text style={styles.ringIcon}>🧬</Text>
      </Animated.View>
      <Text style={styles.title}>Analyzing your health</Text>
      <Text style={styles.sub}>This usually takes a few seconds</Text>
      <View style={styles.steps}>
        {steps.map((s, i) => (
          <Text key={i} style={[styles.step, i <= activeStep && styles.stepActive]}>
            {i <= activeStep ? '✅' : '⏳'} {s}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    backgroundColor: Colors.background,
  },
  ring: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primary,
    borderTopColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  ringIcon: {
    fontSize: 40,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sub: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginBottom: Spacing.xl,
  },
  steps: {
    gap: Spacing.sm,
    alignSelf: 'stretch',
  },
  step: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  stepActive: {
    color: Colors.textSecondary,
  },
});
