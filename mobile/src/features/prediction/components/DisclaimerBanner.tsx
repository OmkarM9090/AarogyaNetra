/**
 * DisclaimerBanner — mandatory medical disclaimer.
 *
 * Rendered on EVERY prediction result screen. On first use the user must
 * acknowledge it (acknowledged state is persisted in the user profile).
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { App } from '../../../shared/constants/app';
import { useAppStore } from '../../../shared/store/useAppStore';
import { useAuthStore } from '../../auth/store/authStore';
import { Colors, Spacing, Typography } from '../../../shared/theme';

interface DisclaimerBannerProps {
  /** Short variant for tight layouts. */
  compact?: boolean;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ compact = false }) => {
  const { disclaimerAcknowledged, acknowledgeDisclaimer } = useAppStore();
  const { user, updateProfile } = useAuthStore();

  const acknowledge = async () => {
    acknowledgeDisclaimer();
    // Persist on the server profile (best effort — never block the UI).
    if (user) {
      try {
        await updateProfile({ disclaimerAcknowledged: true });
      } catch {
        // server-side flag can be set on next profile save
      }
    }
  };

  return (
    <View style={styles.banner}>
      <View style={styles.row}>
        <Text style={styles.icon}>⚕️</Text>
        <Text style={[styles.text, compact && styles.textCompact]}>
          {App.MEDICAL_DISCLAIMER}
        </Text>
      </View>
      {!disclaimerAcknowledged ? (
        <TouchableOpacity style={styles.ackBtn} onPress={acknowledge}>
          <Text style={styles.ackText}>I understand — continue</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(250, 204, 21, 0.10)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.45)',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  icon: {
    fontSize: 16,
  },
  text: {
    ...Typography.bodySmall,
    color: '#8a6d00',
    lineHeight: 18,
    flex: 1,
    fontStyle: 'italic',
  },
  textCompact: {
    fontSize: 11,
    lineHeight: 15,
  },
  ackBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  ackText: {
    ...Typography.bodySmall,
    color: '#fff',
    fontWeight: '800',
  },
});
