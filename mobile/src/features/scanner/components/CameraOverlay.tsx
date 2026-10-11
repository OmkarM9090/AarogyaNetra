/**
 * CameraOverlay — positions the guide + capture affordances over the
 * live camera preview.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { EyeGuide } from './EyeGuide';

interface CameraOverlayProps {
  label: string;
  hint?: string;
  active?: boolean;
  children?: React.ReactNode;
}

export const CameraOverlay: React.FC<CameraOverlayProps> = ({ label, hint, active, children }) => (
  <View style={styles.wrap}>
    <EyeGuide label={label} hint={hint} active={active} />
    {children}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
  },
});
