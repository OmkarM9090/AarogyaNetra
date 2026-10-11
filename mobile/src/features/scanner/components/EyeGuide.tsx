/**
 * EyeGuide — dashed eye-shape overlay for the camera viewfinder.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Typography } from '../../../shared/theme';

interface EyeGuideProps {
  label: string;
  hint?: string;
  active?: boolean;
}

export const EyeGuide: React.FC<EyeGuideProps> = ({ label, hint, active = false }) => (
  <View style={styles.overlay}>
    <View style={[styles.eyeOval, active && styles.eyeOvalActive]} />
    <Text style={styles.label}>{label}</Text>
    {hint ? <Text style={styles.hint}>{hint}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeOval: {
    width: 210,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: Colors.anemia,
    borderStyle: 'dashed',
  },
  eyeOvalActive: {
    borderStyle: 'solid',
  },
  label: {
    ...Typography.body,
    color: Colors.anemia,
    marginTop: 8,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hint: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
