/**
 * SettingsScreen — language, disclaimer acknowledgment, data reset, about.
 */
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../shared/components/ui/Button';
import { Card } from '../../../shared/components/ui/Card';
import { ScreenWrapper } from '../../../shared/components/layout/ScreenWrapper';
import { useToast } from '../../../shared/components/feedback/Toast';
import { LanguageSelector } from '../components/LanguageSelector';
import { useAppStore } from '../../../shared/store/useAppStore';
import { useAuthStore } from '../../auth/store/authStore';
import { useHealthStore } from '../../../shared/store/useHealthStore';
import { storageService } from '../../../shared/services/storage/asyncStorageService';
import { App } from '../../../shared/constants/app';
import { Config } from '../../../shared/constants/config';
import { useLanguage } from '../../../shared/i18n';
import { Colors, Spacing, Typography } from '../../../shared/theme';

export const SettingsScreen: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const { disclaimerAcknowledged, acknowledgeDisclaimer } = useAppStore();
  const { logout } = useAuthStore();
  const clearHealth = useHealthStore(s => s.clearAll);
  const [resetting, setResetting] = useState(false);

  const confirmResetData = () => {
    Alert.alert(
      'Reset local data',
      'This deletes cached scans, summaries and the offline queue on THIS device. Your account and server data are untouched.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            clearHealth();
            await storageService.clearAll();
            setResetting(false);
            toast.success('Local data cleared');
          },
        },
      ],
    );
  };

  return (
    <ScreenWrapper scroll>
      <View style={styles.wrap}>
        <LanguageSelector />

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>⚕️ Medical disclaimer</Text>
          <Text style={styles.disclaimerText}>{App.MEDICAL_DISCLAIMER}</Text>
          {!disclaimerAcknowledged ? (
            <Button title="I understand" size="small" onPress={acknowledgeDisclaimer} />
          ) : (
            <Text style={styles.acked}>✓ Acknowledged</Text>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>🗄️ Data</Text>
          <Pressable style={styles.rowItem} onPress={confirmResetData} disabled={resetting}>
            <Text style={styles.rowItemText}>🧹 Reset local data</Text>
          </Pressable>
          <Pressable style={styles.rowItem} onPress={() => toast.info(`Server: ${Config.API_BASE_URL}`)}>
            <Text style={styles.rowItemText}>📡 Server address</Text>
          </Pressable>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>ℹ️ About</Text>
          <Text style={styles.aboutText}>
            {App.NAME} v{App.VERSION}
            {'\n'}AI-based early screening for Diabetes, Hypertension and Anemia.
            {'\n\n'}
            Screening is powered by machine-learning models running on the AarogyaNetra
            backend. Results are educational and never replace professional medical care.
          </Text>
          <Text style={styles.disclaimerText}>⚠️ {t('footer_disclaimer')}</Text>
        </Card>

        <Button
          title="🚪 Log out"
          variant="danger"
          size="large"
          fullWidth
          onPress={() => {
            Alert.alert('Log out', 'You will need to sign in again.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Log out', style: 'destructive', onPress: () => void logout() },
            ]);
          }}
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    gap: Spacing.sm,
  },
  cardTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  disclaimerText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  acked: {
    ...Typography.bodySmall,
    color: Colors.success,
    fontWeight: '700',
  },
  rowItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  rowItemText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  aboutText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
