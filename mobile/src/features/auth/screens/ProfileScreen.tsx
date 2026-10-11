/**
 * ProfileScreen — view + edit the authenticated user's profile.
 * Saves via PUT /auth/me; logout clears the session.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../../app/navigation/types';

type ProfileNav = NativeStackNavigationProp<ProfileStackParamList>;

import { Button } from '../../../shared/components/ui/Button';
import { Card } from '../../../shared/components/ui/Card';
import { Input } from '../../../shared/components/ui/Input';
import { ScreenWrapper } from '../../../shared/components/layout/ScreenWrapper';
import { useToast } from '../../../shared/components/feedback/Toast';
import { Medical } from '../../../shared/constants/medical';
import { App } from '../../../shared/constants/app';
import { toNormalizedError } from '../../../shared/services/api/apiClient';
import { useLanguage } from '../../../shared/i18n';
import { Colors, Spacing, Typography } from '../../../shared/theme';
import type { BloodGroup, Gender } from '../../../shared/types/user';
import { ageFromDob } from '../../../shared/utils/dateUtils';
import { initials } from '../../../shared/utils/formatting';
import { inRange, isValidPhone, toNumber } from '../../../shared/utils/validation';
import { useAuth } from '../hooks/useAuth';

interface FormState {
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender | '';
  bloodGroup: BloodGroup | 'unknown';
  heightCm: string;
  weightKg: string;
}

function fromUser(u: import('../../../shared/types/user').User): FormState {
  return {
    fullName: u.fullName,
    phone: u.phone ?? '',
    dateOfBirth: u.dateOfBirth ? u.dateOfBirth.slice(0, 10) : '',
    gender: u.gender ?? '',
    bloodGroup: u.bloodGroup ?? 'unknown',
    heightCm: u.heightCm ? String(u.heightCm) : '',
    weightKg: u.weightKg ? String(u.weightKg) : '',
  };
}

export const ProfileScreen: React.FC = () => {
  const { t } = useLanguage();
  const { user, logout, updateProfile, isLoading } = useAuth();
  const toast = useToast();
  const navigation = useNavigation<ProfileNav>();

  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (user) setForm(fromUser(user));
  }, [user]);

  const age = useMemo(() => {
    const d = form?.dateOfBirth || user?.dateOfBirth;
    return d ? ageFromDob(d) : null;
  }, [form, user]);

  if (!user || !form) {
    return <ScreenWrapper />;
  }

  const set = (key: keyof FormState) => (value: string) =>
    setForm(prev => (prev ? { ...prev, [key]: value } : prev));

  const save = async () => {
    const next: typeof errors = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required';
    if (form.phone && !isValidPhone(form.phone)) next.phone = 'Enter a valid phone number';
    if (form.dateOfBirth) {
      const a = ageFromDob(form.dateOfBirth);
      if (a === null || a < Medical.AGE_RANGE.min || a > Medical.AGE_RANGE.max) {
        next.dateOfBirth = 'Enter a valid date of birth';
      }
    }
    if (form.heightCm) {
      const c = inRange(toNumber(form.heightCm), Medical.HEIGHT_RANGE.min, Medical.HEIGHT_RANGE.max, 'Height');
      if (!c.ok) next.heightCm = c.error;
    }
    if (form.weightKg) {
      const c = inRange(toNumber(form.weightKg), Medical.WEIGHT_RANGE.min, Medical.WEIGHT_RANGE.max, 'Weight');
      if (!c.ok) next.weightKg = c.error;
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await updateProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup,
        heightCm: form.heightCm ? toNumber(form.heightCm) : undefined,
        weightKg: form.weightKg ? toNumber(form.weightKg) : undefined,
      });
      toast.success('Profile updated');
    } catch (e) {
      const err = toNormalizedError(e);
      toast.error(err.message);
    }
  };

  const confirmLogout = () => {
    void logout();
  };

  return (
    <ScreenWrapper scroll>
      <View style={styles.wrap}>
        {/* Header card */}
        <Card variant="elevated" style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user.fullName) || 'U'}</Text>
          </View>
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.email}>{user.email}</Text>
          {age !== null ? (
            <Text style={styles.meta}>
              {age} yrs{form.gender ? ` · ${form.gender === 'male' ? t('male') : t('female')}` : ''}
              {form.bloodGroup && form.bloodGroup !== 'unknown' ? ` · ${form.bloodGroup}` : ''}
            </Text>
          ) : null}
        </Card>

        {/* Editable fields */}
        <Card style={styles.formCard}>
          <Text style={styles.cardTitle}>✏️ {t('edit_profile')}</Text>
          <Input label={t('full_name')} value={form.fullName} onChangeText={set('fullName')} error={errors.fullName} />
          <Input label="📱 Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" error={errors.phone} />
          <Input
            label={`🎂 ${t('date_of_birth_label')}`}
            value={form.dateOfBirth}
            onChangeText={set('dateOfBirth')}
            keyboardType="numeric"
            placeholder="YYYY-MM-DD"
            error={errors.dateOfBirth}
          />
          <View style={styles.row}>
            {(['male', 'female'] as Gender[]).map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, form.gender === g && styles.chipActive]}
                onPress={() => setForm(prev => (prev ? { ...prev, gender: prev.gender === g ? '' : g } : prev))}
              >
                <Text style={[styles.chipText, form.gender === g && styles.chipTextActive]}>
                  {g === 'male' ? `👨 ${t('male')}` : `👩 ${t('female')}`}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.chip, form.bloodGroup !== 'unknown' && styles.chipActive]}
              onPress={() =>
                setForm(prev => {
                  if (!prev) return prev;
                  const order: (BloodGroup | 'unknown')[] = [
                    'unknown', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-',
                  ];
                  const idx = order.indexOf(prev.bloodGroup);
                  return { ...prev, bloodGroup: order[(idx + 1) % order.length] };
                })
              }
            >
              <Text style={[styles.chipText, form.bloodGroup !== 'unknown' && styles.chipTextActive]}>
                🩸 {form.bloodGroup === 'unknown' ? '—' : form.bloodGroup}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <View style={styles.half}>
              <Input label={`📏 ${t('height_cm')}`} value={form.heightCm} onChangeText={set('heightCm')} keyboardType="numeric" error={errors.heightCm} />
            </View>
            <View style={styles.half}>
              <Input label={`⚖️ ${t('weight_kg')}`} value={form.weightKg} onChangeText={set('weightKg')} keyboardType="numeric" error={errors.weightKg} />
            </View>
          </View>
          <Button title={t('save_profile')} onPress={save} fullWidth loading={isLoading} />
        </Card>

        {/* App actions */}
        <Card style={styles.formCard}>
          <Text style={styles.cardTitle}>⚙️ {t('language_settings')}</Text>
          <TouchableOpacity style={styles.rowItem} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.rowItemText}>🌐 {t('change_language')}</Text>
            <Text style={styles.rowItemArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rowItem} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.rowItemText}>ℹ️ {t('about_app')}</Text>
            <Text style={styles.rowItemArrow}>→</Text>
          </TouchableOpacity>
        </Card>

        <Button title={`${t('logout')} (${App.VERSION})`} variant="danger" fullWidth size="large" onPress={confirmLogout} />
        <Text style={styles.disclaimer}>⚠️ {t('footer_disclaimer')}</Text>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  headerCard: {
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  name: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  email: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  meta: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  formCard: {
    gap: Spacing.sm,
  },
  cardTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  half: {
    flex: 1,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  chipText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  rowItemText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  rowItemArrow: {
    color: Colors.textTertiary,
    fontWeight: '700',
  },
  disclaimer: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
