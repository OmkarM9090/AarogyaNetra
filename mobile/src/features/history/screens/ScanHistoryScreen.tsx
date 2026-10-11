/**
 * ScanHistoryScreen — the History tab.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { ScreenWrapper } from '../../../shared/components/layout/ScreenWrapper';
import { useScanHistory } from '../hooks/useScanHistory';
import { ScanHistoryList } from '../components/ScanHistoryList';
import { useLanguage } from '../../../shared/i18n';
import { Colors, Spacing, Typography } from '../../../shared/theme';
import type { ScanRecord } from '../../../shared/types/scan';
import type { HistoryStackParamList } from '../../../app/navigation/types';

type Nav = import('@react-navigation/native-stack').NativeStackNavigationProp<HistoryStackParamList>;

export const ScanHistoryScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { t } = useLanguage();
  const { items, total, isLoading, error, hasMore, loadMore, refresh } = useScanHistory();

  const openScan = (scan: ScanRecord) => navigation.navigate('ScanDetail', { scanId: scan.id });

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>📊 {t('scan_history')}</Text>
          <Text style={styles.subtitle}>
            {total > 0 ? `${total} total scan${total === 1 ? '' : 's'}` : 'Your screening timeline'}
          </Text>
        </View>
        <Pressable style={styles.refreshBtn} onPress={refresh}>
          <Text style={styles.refreshText}>🔄</Text>
        </Pressable>
      </View>
      <ScanHistoryList
        items={items}
        isLoading={isLoading}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onOpen={openScan}
        onRetry={refresh}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: {
    fontSize: 16,
  },
});
