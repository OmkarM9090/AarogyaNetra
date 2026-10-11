/**
 * RegisterScreen — account creation with the profile fields the
 * screening models need (age via DOB, gender, height/weight).
 *
 * Register → auto-login: the backend returns a token pair on success.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Button } from '../../../shared/components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { ScreenWrapper } from '../../../shared/components/layout/ScreenWrapper';
import { useToast } from '../../../shared/components/feedback/Toast';
import { Medical } from '../../../shared/constants/medical';
import { toNormalizedError } from '../../../shared/services/api/apiClient';
import { useLanguage } from '../../../shared/i18n';
import { Colors, Spacing, Typography } from '../../../shared/theme';
import type { Gender } from '../../../shared/types/user';
import { inRange, isValidEmail, isValidPhone, passwordIssues, toNumber } from '../../../shared/utils/validation';
import { ageFromDob } from '../../../shared/utils/dateUtils';
import { AuthField } from '../components/AuthField';
import { EMPTY_REGISTER_FORM, type RegisterFormState } from '../types';

const GENDERS: { value: Gender | ''; label: string; icon: string }[] = [
  { value: 'male', label: 'Male', icon: '👨' },
  { value: 'female', label: 'Female', icon: '👩' },
];

export const RegisterScreen: React.FC = () => {
  const { t } = useLanguage();
  const { register, isLoading } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState<RegisterFormState>(EMPTY_REGISTER_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormState, string>>>({});

  const set = (key: keyof RegisterFormState) => (value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required';
    if (!isValidEmail(form.email)) next.email = 'Enter a valid email address';

    const pwIssues = passwordIssues(form.password);
    if (pwIssues.length > 0) next.password = `Password: ${pwIssues.join(', ').toLowerCase()}`;
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match';
    if (form.phone && !isValidPhone(form.phone)) next.phone = 'Enter a valid phone number';

    if (form.dateOfBirth) {
      const age = ageFromDob(form.dateOfBirth);
      if (age === null) {
        next.dateOfBirth = 'Enter a valid date of birth';
      } else if (age < Medical.AGE_RANGE.min || age > Medical.AGE_RANGE.max) {
        next.dateOfBirth = `Age must be between ${Medical.AGE_RANGE.min} and ${Medical.AGE_RANGE.max}`;
      }
    }

    if (form.heightCm) {
      const check = inRange(toNumber(form.heightCm), Medical.HEIGHT_RANGE.min, Medical.HEIGHT_RANGE.max, 'Height');
      if (!check.ok) next.heightCm = check.error;
    }
    if (form.weightKg) {
      const check = inRange(toNumber(form.weightKg), Medical.WEIGHT_RANGE.min, Medical.WEIGHT_RANGE.max, 'Weight');
      if (!check.ok) next.weightKg = check.error;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    try {
      await register({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        heightCm: form.heightCm ? toNumber(form.heightCm) : undefined,
        weightKg: form.weightKg ? toNumber(form.weightKg) : undefined,
      });
      toast.success('Account created — welcome!');
    } catch (e) {
      const err = toNormalizedError(e);
      if (err.kind === 'validation' && err.fieldErrors?.email) {
        setErrors({ email: err.fieldErrors.email });
        return;
      }
      toast.error(err.message);
    }
  };

  return (
    <ScreenWrapper scroll>
      <View style={styles.wrap}>
        <Text style={styles.logo}>🌿</Text>
        <Text style={styles.title}>{t('register_title')}</Text>
        <Text style={styles.subtitle}>{t('register_subtitle')}</Text>

        <Text style={styles.section}>{t('about_you')}</Text>
        <AuthField
          label={t('full_name')}
          icon="👤"
          value={form.fullName}
          onChangeText={set('fullName')}
          placeholder={t('name_placeholder')}
          autoCapitalize="words"
          error={errors.fullName}
        />
        <AuthField
          label={t('email_label')}
          icon="✉️"
          value={form.email}
          onChangeText={set('email')}
          placeholder={t('email_placeholder')}
          keyboardType="email-address"
          error={errors.email}
        />
        <AuthField
          label={t('password_label')}
          icon="🔒"
          value={form.password}
          onChangeText={set('password')}
          secureTextEntry
          error={errors.password}
        />
        <AuthField
          label={t('confirm_password_label')}
          icon="🔒"
          value={form.confirm}
          onChangeText={set('confirm')}
          secureTextEntry
          error={errors.confirm}
        />

        <Text style={styles.section}>
          {t('optional_label')} —{' '}
          <Text style={{ color: Colors.textTertiary }}>{t('profile_subtitle')}</Text>
        </Text>
        <AuthField
          label="📱 Phone"
          value={form.phone}
          onChangeText={set('phone')}
          placeholder="+91 98765 43210"
          keyboardType="phone-pad"
          error={errors.phone}
        />
        <AuthField
          label={`🎂 ${t('date_of_birth_label')}`}
          value={form.dateOfBirth}
          onChangeText={set('dateOfBirth')}
          placeholder="YYYY-MM-DD"
          keyboardType="numeric"
          error={errors.dateOfBirth}
        />

        <View style={styles.row}>
          {GENDERS.map((g) => (
            <View
              key={g.value || 'unknown'}
              style={[styles.genderBtn, form.gender === g.value && styles.genderBtnActive]}
            >
              <TouchableOpacity
                style={styles.genderInner}
                onPress={() => setForm(prev => ({ ...prev, gender: g.value }))}
              >
                <Text style={styles.genderIcon}>{g.icon}</Text>
                <Text style={[styles.genderLabel, form.gender === g.value && styles.genderLabelActive]}>
                  {g.value === 'male' ? t('male') : g.value === 'female' ? t('female') : g.label}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <AuthField
              label={`📏 ${t('height_cm')}`}
              value={form.heightCm}
              onChangeText={set('heightCm')}
              placeholder="165"
              keyboardType="numeric"
              error={errors.heightCm}
            />
          </View>
          <View style={styles.half}>
            <AuthField
              label={`⚖️ ${t('weight_kg')}`}
              value={form.weightKg}
              onChangeText={set('weightKg')}
              placeholder="65"
              keyboardType="numeric"
              error={errors.weightKg}
            />
          </View>
        </View>

        <Button title={t('create_account')} onPress={submit} size="large" fullWidth loading={isLoading} />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: {
    padding: Spacing.xxl,
    paddingBottom: Spacing.huge,
  },
  logo: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  section: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  half: {
    flex: 1,
  },
  genderBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  genderBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  genderInner: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  genderIcon: {
    fontSize: 22,
  },
  genderLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  genderLabelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
});
