/**
 * DashboardScreen — the home tab.
 *
 * Greeting + overall risk (from /predictions/summary, cache-first),
 * per-condition risk indicators, recent scans, and quick actions.
 * When offline the cached data is shown with an offline banner.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { AppParamList } from '../../../app/navigation/types';

import { Button } from '../../../shared/components/ui/Button';
import { Card } from '../../../shared/components/ui/Card';
import { ScreenWrapper } from '../../../shared/components/layout/ScreenWrapper';
import { EmptyState } from '../../../shared/components/feedback/EmptyState';
import { useDashboard } from '../hooks/useDashboard';
import { HealthSummaryCard } from '../components/HealthSummaryCard';
import { RiskIndicator } from '../components/RiskIndicator';
import { RecentScansWidget } from '../components/RecentScansWidget';
import { QuickActions } from '../components/QuickActions';
import { useAuth } from '../../auth/hooks/useAuth';
import { useNetworkStatus } from '../../../shared/hooks/useNetworkStatus';
import { useLanguage } from '../../../shared/i18n';
import { Colors, Spacing, Typography } from '../../../shared/theme';
import { CONDITION_META } from '../../../shared/utils/healthUtils';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<AppParamList>>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isOnline } = useNetworkStatus();
  const { riskSummary, scanHistory, isLoading, refresh } = useDashboard();

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? t('good_morning') : greetingHour < 17 ? t('good_afternoon') : t('good_evening');

  return (
    <ScreenWrapper scroll>
      <View style={styles.wrap}>
        {/* Offline banner */}
        {!isOnline ? (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>📡 Offline — showing your last saved data</Text>
          </View>
        ) : null}

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.userName}>{user?.fullName || t('welcome')}</Text>
          </View>
        </View>

        {/* Primary CTA */}
        <View style={styles.ctaArea}>
          <Button
            title="🩺 Start health check"
            size="large"
            fullWidth
            onPress={() => navigation.navigate('ScannerTab')}
          />
          <Text style={styles.ctaHint}>
            💬 {t('step_questions')} → 📷 {t('step_face_scan')} → 📊 {t('step_report')}
          </Text>
        </View>

        {/* What we detect */}
        <View style={styles.detectRow}>
          {(['diabetes', 'hypertension', 'anemia'] as const).map((cond) => (
            <View key={cond} style={[styles.detectChip, { backgroundColor: `${CONDITION_META[cond].color}10` }]}>
              <Text>{CONDITION_META[cond].icon}</Text>
              <Text style={[styles.detectLabel, { color: CONDITION_META[cond].color }]}>
                {t(cond === 'diabetes' ? 'diabetes' : cond === 'hypertension' ? 'hypertension' : 'anemia')}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary / empty state */}
        {riskSummary ? (
          <>
            <HealthSummaryCard summary={riskSummary} />
            <Card style={styles.riskCard}>
              <Text style={styles.sectionTitle}>{t('risk_analysis')}</Text>
              {(['diabetes', 'hypertension', 'anemia'] as const).map((cond) => (
                <RiskIndicator
                  key={cond}
                  entry={riskSummary.riskByCondition[cond]}
                  icon={CONDITION_META[cond].icon}
                  color={CONDITION_META[cond].color}
                />
              ))}
            </Card>
          </>
        ) : (
          <EmptyState
            icon="🔍"
            title={t('no_scans_yet')}
            description={t('no_scans_desc')}
          />
        )}

        {/* Recent scans */}
        <RecentScansWidget
          scans={scanHistory}
          onOpen={(scanId) => navigation.navigate('Result', { scanId })}
        />

        {/* Quick actions */}
        <View>
          <Text style={styles.sectionTitle}>{t('quick_access')}</Text>
          <QuickActions
            scanCount={scanHistory.length}
            onScan={() => navigation.navigate('ScannerTab')}
            onHistory={() => navigation.navigate('HistoryTab')}
            onRiskForecast={() => navigation.navigate('RiskEvolution')}
            onSimulation={() => navigation.navigate('LifestyleSim')}
          />
        </View>

        {/* Refresh */}
        <Button title="🔄 Refresh" variant="outline" fullWidth onPress={refresh} loading={isLoading} />

        <Text style={styles.footer}>⚠️ {t('footer_disclaimer')}</Text>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.huge,
  },
  offlineBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    padding: Spacing.sm,
    alignItems: 'center',
  },
  offlineText: {
    ...Typography.bodySmall,
    color: '#92600a',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Spacing.md,
  },
  greeting: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  userName: {
    ...Typography.h1,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  ctaArea: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  ctaHint: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  detectRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  detectChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  detectLabel: {
    ...Typography.caption,
    fontWeight: '700',
  },
  riskCard: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  footer: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
