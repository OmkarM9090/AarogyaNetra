/**
 * ScanPreparationScreen — step 1 of the scan flow.
 *
 * 1. Pick a condition (diabetes / hypertension / anemia)
 * 2. Fill the screening data form for that condition
 * 3. Proceed →
 *    - diabetes/hypertension: straight to processing (API call)
 *    - anemia: to the camera screen to capture the eye image
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { AppParamList } from '../../../app/navigation/types';

import { Button } from '../../../shared/components/ui/Button';
import { Card } from '../../../shared/components/ui/Card';
import { Input } from '../../../shared/components/ui/Input';
import { ScreenWrapper } from '../../../shared/components/layout/ScreenWrapper';
import { useToast } from '../../../shared/components/feedback/Toast';
import { Header } from '../../../shared/components/layout/Header';
import { useAuth } from '../../auth/hooks/useAuth';
import { ageFromDob } from '../../../shared/utils/dateUtils';
import { bmi as computeBmi } from '../../../shared/utils/healthUtils';
import { useLanguage } from '../../../shared/i18n';
import { Colors, Spacing, Typography } from '../../../shared/theme';
import { ANEMIA_SYMPTOMS } from '../../../shared/types/prediction';
import { InstructionCard } from '../components/InstructionCard';
import {
  EMPTY_ANEMIA_FORM,
  EMPTY_DIABETES_FORM,
  EMPTY_HYPERTENSION_FORM,
  ScanValidationError,
  type AnemiaFormState,
  type DiabetesFormState,
  type HypertensionFormState,
  type ScanCondition,
} from '../types';
import {
  validateAnemiaForm,
  validateDiabetesForm,
  validateHypertensionForm,
} from '../utils/scanValidation';

const CONDITION_CARDS: { id: ScanCondition; icon: string; title: string; desc: string; color: string }[] = [
  { id: 'diabetes', icon: '🩸', title: 'Diabetes', desc: 'Glucose, HbA1c, BP and lifestyle factors', color: Colors.primary },
  { id: 'hypertension', icon: '❤️', title: 'Hypertension', desc: 'Blood pressure, heart rate, habits', color: '#ef4444' },
  { id: 'anemia', icon: '👁️', title: 'Anemia', desc: 'Eye image + age, gender and symptoms', color: Colors.anemia },
];

export const ScanPreparationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<AppParamList>>();
  const route = useRoute();
  const { t } = useLanguage();
  const toast = useToast();
  const { user } = useAuth();

  const [selected, setSelected] = useState<ScanCondition | null>(
    (route.params as { preselected?: ScanCondition } | undefined)?.preselected ?? null,
  );
  const [diabetesForm, setDiabetesForm] = useState<DiabetesFormState>(prefillDiabetes(EMPTY_DIABETES_FORM, user));
  const [hypForm, setHypForm] = useState<HypertensionFormState>(prefillHypertension(EMPTY_HYPERTENSION_FORM, user));
  const [anemiaForm, setAnemiaForm] = useState<AnemiaFormState>(prefillAnemia(EMPTY_ANEMIA_FORM, user));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Prefill convenience: derive age/BMI from the profile.
  const profileAge = user?.dateOfBirth ? ageFromDob(user.dateOfBirth) ?? '' : '';
  const profileBmi = computeBmi(user?.weightKg, user?.heightCm);

  const proceed = () => {
    if (!selected) return;
    try {
      if (selected === 'diabetes') {
        const data = validateDiabetesForm(diabetesForm);
        setErrors({});
        navigation.navigate('Processing', {
          condition: 'diabetes',
          payload: { kind: 'diabetes', data },
        });
      } else if (selected === 'hypertension') {
        const data = validateHypertensionForm(hypForm);
        setErrors({});
        navigation.navigate('Processing', {
          condition: 'hypertension',
          payload: { kind: 'hypertension', data },
        });
      } else {
        const data = validateAnemiaForm(anemiaForm);
        setErrors({});
        navigation.navigate('Camera', { payload: { kind: 'anemia', data } });
      }
    } catch (e) {
      if (e instanceof ScanValidationError) {
        setErrors(e.fieldErrors);
        toast.error(e.message);
      } else {
        toast.error('Unexpected error. Please try again.');
      }
    }
  };

  return (
    <ScreenWrapper scroll>
      <View style={styles.wrap}>
        {selected === null ? (
          <>
            <InstructionCard
              title="🩺 Choose what to screen"
              steps={[
                'Pick one condition to start',
                'Fill in your health details (or capture an eye photo)',
                'Get your AI risk result with recommendations',
              ]}
            />
            {CONDITION_CARDS.map((c) => (
              <Pressable
                key={c.id}
                style={[styles.conditionCard, { borderColor: c.color, backgroundColor: `${c.color}08` }]}
                onPress={() => setSelected(c.id)}
              >
                <Text style={styles.conditionIcon}>{c.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.conditionTitle, { color: c.color }]}>{c.title}</Text>
                  <Text style={styles.conditionDesc}>{c.desc}</Text>
                </View>
                <Text style={[styles.chevron, { color: c.color }]}>→</Text>
              </Pressable>
            ))}
          </>
        ) : (
          <>
            <Header
              title={CONDITION_CARDS.find(c => c.id === selected)!.title}
              onBack={() => {
                setSelected(null);
                setErrors({});
              }}
            />

            {selected === 'diabetes' && (
              <DiabetesForm
                form={diabetesForm}
                setForm={setDiabetesForm}
                errors={errors}
                profileAge={profileAge}
                profileBmi={profileBmi}
              />
            )}
            {selected === 'hypertension' && (
              <HypertensionForm
                form={hypForm}
                setForm={setHypForm}
                errors={errors}
                profileAge={profileAge}
                profileBmi={profileBmi}
              />
            )}
            {selected === 'anemia' && (
              <AnemiaForm form={anemiaForm} setForm={setAnemiaForm} errors={errors} profileAge={profileAge} />
            )}

            <View style={styles.actions}>
              {selected === 'anemia' ? (
                <Button title="📸 Continue to eye camera" onPress={proceed} size="large" fullWidth />
              ) : (
                <Button title="🧠 Analyze my risk" onPress={proceed} size="large" fullWidth />
              )}
            </View>
          </>
        )}
      </View>
    </ScreenWrapper>
  );
};

// ─── Sub-forms ─────────────────────────────────────────

function GenderChoice({
  value,
  onChange,
  error,
}: {
  value: 'male' | 'female' | '';
  onChange: (v: 'male' | 'female' | '') => void;
  error?: string;
}) {
  const { t } = useLanguage();
  return (
    <View>
      <View style={styles.choiceRow}>
        {(['male', 'female'] as const).map((g) => (
          <Pressable
            key={g}
            style={[styles.choice, value === g && styles.choiceActive]}
            onPress={() => onChange(g)}
          >
            <Text style={[styles.choiceText, value === g && styles.choiceTextActive]}>
              {g === 'male' ? `👨 ${t('male')}` : `👩 ${t('female')}`}
            </Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function ChoiceRow<T extends string>({
  options,
  value,
  onChange,
  error,
}: {
  options: { value: T; label: string }[];
  value: T | '';
  onChange: (v: T) => void;
  error?: string;
}) {
  return (
    <View>
      <View style={[styles.choiceRow, { flexWrap: 'wrap' }]}>
        {options.map((o) => (
          <Pressable key={o.value} style={[styles.choiceSm, value === o.value && styles.choiceActive]} onPress={() => onChange(o.value)}>
            <Text style={[styles.choiceText, { fontSize: 12 }, value === o.value && styles.choiceTextActive]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function YesNoChoice({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.yesNoRow}>
      <Text style={styles.yesNoLabel}>{label}</Text>
      <View style={styles.choiceRow}>
        <Pressable style={[styles.choiceSm, value && styles.choiceActive]} onPress={() => onChange(true)}>
          <Text style={[styles.choiceText, { fontSize: 12 }, value && styles.choiceTextActive]}>Yes</Text>
        </Pressable>
        <Pressable style={[styles.choiceSm, !value && styles.choiceActive]} onPress={() => onChange(false)}>
          <Text style={[styles.choiceText, { fontSize: 12 }, !value && styles.choiceTextActive]}>No</Text>
        </Pressable>
      </View>
    </View>
  );
}

interface BaseFormProps {
  form: unknown;
  setForm: React.Dispatch<React.SetStateAction<never>>;
  errors: Record<string, string>;
  profileAge: string | number;
  profileBmi: number | null;
}

function AgeGenderBmiBlock({
  age,
  onAge,
  gender,
  onGender,
  bmi,
  onBmi,
  errors,
  profileAge,
  profileBmi,
}: {
  age: string;
  onAge: (v: string) => void;
  gender: 'male' | 'female' | '';
  onGender: (v: 'male' | 'female' | '') => void;
  bmi: string;
  onBmi: (v: string) => void;
  errors: Record<string, string>;
  profileAge: string | number;
  profileBmi: number | null;
}) {
  return (
    <>
      <View style={styles.row}>
        <View style={styles.half}>
          <Input
            label="🎂 Age (yrs)"
            value={age}
            onChangeText={onAge}
            keyboardType="numeric"
            placeholder={profileAge ? String(profileAge) : '45'}
            error={errors.age}
          />
        </View>
        <View style={styles.half}>
          <Input
            label="⚖️ BMI"
            value={bmi}
            onChangeText={onBmi}
            keyboardType="numeric"
            placeholder={profileBmi ? String(profileBmi) : '24'}
            hint={profileBmi ? `From profile: ${profileBmi}` : 'weight(kg) ÷ height(m)²'}
            error={errors.bmi}
          />
        </View>
      </View>
      <GenderChoice value={gender} onChange={onGender} error={errors.gender} />
    </>
  );
}

function DiabetesForm({
  form,
  setForm,
  errors,
  profileAge,
  profileBmi,
}: {
  form: DiabetesFormState;
  setForm: React.Dispatch<React.SetStateAction<DiabetesFormState>>;
  errors: Record<string, string>;
  profileAge: string | number;
  profileBmi: number | null;
}) {
  const set = <K extends keyof DiabetesFormState>(key: K) => (value: DiabetesFormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Card style={styles.formCard}>
      <AgeGenderBmiBlock
        age={form.age}
        onAge={set('age')}
        gender={form.gender}
        onGender={set('gender')}
        bmi={form.bmi}
        onBmi={set('bmi')}
        errors={errors}
        profileAge={profileAge}
        profileBmi={profileBmi}
      />
      <View style={styles.row}>
        <View style={styles.half}>
          <Input label="🩸 Fasting glucose (mg/dL)" value={form.bloodGlucoseFasting} onChangeText={set('bloodGlucoseFasting')} keyboardType="numeric" error={errors.bloodGlucoseFasting} />
        </View>
        <View style={styles.half}>
          <Input label=" HbA1c (%)" value={form.hba1c} onChangeText={set('hba1c')} keyboardType="decimal-pad" error={errors.hba1c} />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.half}>
          <Input label="🩺 Systolic BP" value={form.bloodPressureSystolic} onChangeText={set('bloodPressureSystolic')} keyboardType="numeric" error={errors.bloodPressureSystolic} />
        </View>
        <View style={styles.half}>
          <Input label="🩺 Diastolic BP" value={form.bloodPressureDiastolic} onChangeText={set('bloodPressureDiastolic')} keyboardType="numeric" error={errors.bloodPressureDiastolic} />
        </View>
      </View>
      <Input label="🏃 Weekly activity (minutes)" value={form.physicalActivityMinutesWeekly} onChangeText={set('physicalActivityMinutesWeekly')} keyboardType="numeric" error={errors.physicalActivityMinutesWeekly} />
      <ChoiceRow
        options={[
          { value: 'never', label: '🚭 Never' },
          { value: 'former', label: '🚸 Former' },
          { value: 'current', label: '🚬 Current' },
        ]}
        value={form.smokingStatus}
        onChange={set('smokingStatus')}
        error={errors.smokingStatus}
      />
      <YesNoChoice label="👪 Family history of diabetes" value={form.familyHistoryDiabetes} onChange={set('familyHistoryDiabetes')} />
      <Input label="📏 Waist circumference (cm, optional)" value={form.waistCircumferenceCm} onChangeText={set('waistCircumferenceCm')} keyboardType="numeric" error={errors.waistCircumferenceCm} />
    </Card>
  );
}

function HypertensionForm({
  form,
  setForm,
  errors,
  profileAge,
  profileBmi,
}: {
  form: HypertensionFormState;
  setForm: React.Dispatch<React.SetStateAction<HypertensionFormState>>;
  errors: Record<string, string>;
  profileAge: string | number;
  profileBmi: number | null;
}) {
  const set = <K extends keyof HypertensionFormState>(key: K) => (value: HypertensionFormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Card style={styles.formCard}>
      <AgeGenderBmiBlock
        age={form.age}
        onAge={set('age')}
        gender={form.gender}
        onGender={set('gender')}
        bmi={form.bmi}
        onBmi={set('bmi')}
        errors={errors}
        profileAge={profileAge}
        profileBmi={profileBmi}
      />
      <View style={styles.row}>
        <View style={styles.half}>
          <Input label="🩺 Systolic BP" value={form.bloodPressureSystolic} onChangeText={set('bloodPressureSystolic')} keyboardType="numeric" error={errors.bloodPressureSystolic} />
        </View>
        <View style={styles.half}>
          <Input label="🩺 Diastolic BP" value={form.bloodPressureDiastolic} onChangeText={set('bloodPressureDiastolic')} keyboardType="numeric" error={errors.bloodPressureDiastolic} />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.half}>
          <Input label="❤️ Heart rate (bpm)" value={form.heartRate} onChangeText={set('heartRate')} keyboardType="numeric" error={errors.heartRate} />
        </View>
        <View style={styles.half}>
          <Input label="🧈 Cholesterol (mg/dL, opt.)" value={form.cholesterolTotal} onChangeText={set('cholesterolTotal')} keyboardType="numeric" error={errors.cholesterolTotal} />
        </View>
      </View>
      <Input label="🏃 Weekly activity (minutes)" value={form.physicalActivityMinutesWeekly} onChangeText={set('physicalActivityMinutesWeekly')} keyboardType="numeric" error={errors.physicalActivityMinutesWeekly} />
      <ChoiceRow
        options={[
          { value: 'never', label: '🚭 Never' },
          { value: 'former', label: '🚸 Former' },
          { value: 'current', label: '🚬 Current' },
        ]}
        value={form.smokingStatus}
        onChange={set('smokingStatus')}
        error={errors.smokingStatus}
      />
      <ChoiceRow
        options={[
          { value: 'none', label: '🚫 None' },
          { value: 'moderate', label: '🍷 Moderate' },
          { value: 'heavy', label: '🍺 Heavy' },
        ]}
        value={form.alcoholConsumption}
        onChange={set('alcoholConsumption')}
        error={errors.alcoholConsumption}
      />
      <ChoiceRow
        options={[
          { value: 'low', label: '🧂 Low salt' },
          { value: 'moderate', label: '🧂 Moderate' },
          { value: 'high', label: '🧂 High' },
        ]}
        value={form.saltIntake}
        onChange={set('saltIntake')}
        error={errors.saltIntake}
      />
      <ChoiceRow
        options={[
          { value: 'low', label: '😌 Low stress' },
          { value: 'moderate', label: '😐 Moderate' },
          { value: 'high', label: '😰 High' },
        ]}
        value={form.stressLevel}
        onChange={set('stressLevel')}
        error={errors.stressLevel}
      />
      <YesNoChoice label="👪 Family history of hypertension" value={form.familyHistoryHypertension} onChange={set('familyHistoryHypertension')} />
    </Card>
  );
}

function AnemiaForm({
  form,
  setForm,
  errors,
  profileAge,
}: {
  form: AnemiaFormState;
  setForm: React.Dispatch<React.SetStateAction<AnemiaFormState>>;
  errors: Record<string, string>;
  profileAge: string | number;
}) {
  const toggleSymptom = (s: (typeof ANEMIA_SYMPTOMS)[number]['value']) =>
    setForm(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(s)
        ? prev.symptoms.filter(x => x !== s)
        : [...prev.symptoms, s],
    }));

  return (
    <Card style={styles.formCard}>
      <Input
        label="🎂 Age (yrs)"
        value={form.age}
        onChangeText={v => setForm(prev => ({ ...prev, age: v }))}
        keyboardType="numeric"
        placeholder={profileAge ? String(profileAge) : '35'}
        error={errors.age}
      />
      <GenderChoice
        value={form.gender}
        onChange={v => setForm(prev => ({ ...prev, gender: v }))}
        error={errors.gender}
      />
      <Text style={styles.sectionLabel}>Symptoms you notice (tap all that apply)</Text>
      <View style={styles.symptomGrid}>
        {ANEMIA_SYMPTOMS.map((s) => {
          const active = form.symptoms.includes(s.value);
          return (
            <Pressable
              key={s.value}
              style={[styles.symptomChip, active && { borderColor: Colors.anemia, backgroundColor: `${Colors.anemia}10` }]}
              onPress={() => toggleSymptom(s.value)}
            >
              <Text>{s.icon}</Text>
              <Text style={[styles.symptomText, active && styles.symptomTextActive]} numberOfLines={2}>
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.anemiaNote}>
        After this form you will take a photo of your open eye. The AI detects the eye region
        and analyzes conjunctival pallor.
      </Text>
    </Card>
  );
}

// ─── Prefills ──────────────────────────────────────────

function prefillDiabetes(f: DiabetesFormState, user: import('../../../shared/types/user').User | null): DiabetesFormState {
  if (!user) return f;
  const age = user.dateOfBirth ? ageFromDob(user.dateOfBirth) : null;
  const bmi = computeBmi(user.weightKg, user.heightCm);
  return {
    ...f,
    age: age !== null ? String(age) : f.age,
    gender: user.gender ?? '',
    bmi: bmi ? String(bmi) : f.bmi,
  };
}

function prefillHypertension(f: HypertensionFormState, user: import('../../../shared/types/user').User | null): HypertensionFormState {
  if (!user) return f;
  const age = user.dateOfBirth ? ageFromDob(user.dateOfBirth) : null;
  const bmi = computeBmi(user.weightKg, user.heightCm);
  return {
    ...f,
    age: age !== null ? String(age) : f.age,
    gender: user.gender ?? '',
    bmi: bmi ? String(bmi) : f.bmi,
  };
}

function prefillAnemia(f: AnemiaFormState, user: import('../../../shared/types/user').User | null): AnemiaFormState {
  if (!user) return f;
  const age = user.dateOfBirth ? ageFromDob(user.dateOfBirth) : null;
  return {
    ...f,
    age: age !== null ? String(age) : f.age,
    gender: user.gender ?? '',
  };
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  conditionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: Spacing.lg,
  },
  conditionIcon: {
    fontSize: 30,
  },
  conditionTitle: {
    ...Typography.h4,
    fontWeight: '800',
  },
  conditionDesc: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '800',
  },
  formCard: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  half: {
    flex: 1,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  choice: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  choiceSm: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  choiceActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  choiceText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  choiceTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  yesNoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  yesNoLabel: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  fieldError: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxWidth: '48%',
  },
  symptomText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  symptomTextActive: {
    color: Colors.anemia,
    fontWeight: '800',
  },
  anemiaNote: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    lineHeight: 17,
  },
  actions: {
    marginTop: Spacing.lg,
  },
});
