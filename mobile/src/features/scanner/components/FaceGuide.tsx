/**
 * FaceGuide — face oval overlay (kept for future rPPG camera flows).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Typography } from '../../../shared/theme';

interface FaceGuideProps {
  label: string;
}

export const FaceGuide: React.FC<FaceGuideProps> = ({ label }) => (
  <View style={styles.overlay}>
    <View style={styles.faceOval} />
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceOval: {
    width: 170,
    height: 210,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: 'rgba(108,99,255,0.65)',
    borderStyle: 'dashed',
  },
  label: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
