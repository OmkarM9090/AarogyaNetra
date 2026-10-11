/**
 * LoginScreen — email + password sign-in.
 *
 * On success the token pair is persisted and the user is fetched via
 * GET /auth/me, after which the RootNavigator switches to MainTabs.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Button } from '../../../shared/components/ui/Button';
import { ScreenWrapper } from '../../../shared/components/layout/ScreenWrapper';
import { useToast } from '../../../shared/components/feedback/Toast';
import { toNormalizedError } from '../../../shared/services/api/apiClient';
import { useLanguage } from '../../../shared/i18n';
import { Colors, Spacing, Typography } from '../../../shared/theme';
import { isValidEmail } from '../../../shared/utils/validation';
import { useAuth } from '../hooks/useAuth';
import { AuthField } from '../components/AuthField';

export const LoginScreen: React.FC = () => {
  const { t } = useLanguage();
  const { login, isLoading } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = async () => {
    const next: typeof errors = {};
    if (!isValidEmail(email)) next.email = 'Enter a valid email address';
    if (password.length < 8) next.password = 'Password must be at least 8 characters';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await login(email.trim(), password);
      toast.success('Signed in');
    } catch (e) {
      const err = toNormalizedError(e);
      toast.error(
        err.kind === 'unauthorized' ? 'Invalid email or password.' : err.message,
      );
    }
  };

  return (
    <ScreenWrapper scroll>
      <View style={styles.wrap}>
        <Text style={styles.logo}>🏥</Text>
        <Text style={styles.title}>{t('login_title')}</Text>
        <Text style={styles.subtitle}>{t('login_subtitle')}</Text>
        <Text style={styles.note}>ℹ️ {t('screening_note')}</Text>

        <View style={styles.form}>
          <AuthField
            label={t('email_label')}
            icon="✉️"
            value={email}
            onChangeText={setEmail}
            placeholder={t('email_placeholder')}
            keyboardType="email-address"
            error={errors.email}
          />
          <AuthField
            label={t('password_label')}
            icon="🔒"
            value={password}
            onChangeText={setPassword}
            keyboardType="default"
            secureTextEntry
            error={errors.password}
          />
        </View>

        <Button
          title={t('sign_in')}
          onPress={submit}
          size="large"
          fullWidth
          loading={isLoading}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('need_account')}</Text>
          <TouchableOpacity onPress={() => undefined} disabled>
            <Text style={styles.footerLink}>
              {t('create_account')} —{' '}
              <Text style={{ color: Colors.textTertiary }}>see Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  logo: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  note: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  form: {
    marginBottom: Spacing.lg,
  },
  footer: {
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.lg,
  },
  footerText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  footerLink: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '700',
  },
});
