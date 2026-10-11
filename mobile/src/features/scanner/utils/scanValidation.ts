/**
 * Local pre-flight validation for scan forms — mirrors the backend ranges
 * so the user gets instant feedback before any network call.
 */
import { Medical } from '../../../shared/constants/medical';
import { inRange, toNumber } from '../../../shared/utils/validation';
import {
  type AnemiaFormState,
  type AnemiaInput,
  type DiabetesFormState,
  type DiabetesInput,
  type HypertensionFormState,
  type HypertensionInput,
  ScanValidationError,
} from '../types';

function requireNumber(
  raw: string,
  min: number,
  max: number,
  label: string,
  field: string,
  errors: Record<string, string>,
): number {
  const value = toNumber(raw);
  const check = inRange(value, min, max, label);
  if (!check.ok) errors[field] = check.error ?? `${label} is invalid`;
  return value;
}

function requireGender(raw: '' | 'male' | 'female', field: string, errors: Record<string, string>): 'male' | 'female' {
  if (raw !== 'male' && raw !== 'female') errors[field] = 'Select a gender';
  return raw === 'female' ? 'female' : 'male';
}

function optionalNumber(
  raw: string,
  min: number,
  max: number,
  label: string,
  field: string,
  errors: Record<string, string>,
): number | undefined {
  if (!raw.trim()) return undefined;
  const value = toNumber(raw);
  const check = inRange(value, min, max, label);
  if (!check.ok) errors[field] = check.error ?? `${label} is invalid`;
  return value;
}

export function validateDiabetesForm(form: DiabetesFormState): DiabetesInput {
  const errors: Record<string, string> = {};
  const age = requireNumber(form.age, Medical.AGE_RANGE.min, Medical.AGE_RANGE.max, 'Age', 'age', errors);
  const gender = requireGender(form.gender, 'gender', errors);
  const bmi = requireNumber(form.bmi, Medical.BMI_RANGE.min, Medical.BMI_RANGE.max, 'BMI', 'bmi', errors);
  const glucose = requireNumber(
    form.bloodGlucoseFasting,
    Medical.FASTING_GLUCOSE_RANGE.min,
    Medical.FASTING_GLUCOSE_RANGE.max,
    'Fasting glucose',
    'bloodGlucoseFasting',
    errors,
  );
  const hba1c = requireNumber(form.hba1c, Medical.HBA1C_RANGE.min, Medical.HBA1C_RANGE.max, 'HbA1c', 'hba1c', errors);
  const sys = requireNumber(
    form.bloodPressureSystolic,
    Medical.BP_SYSTOLIC_RANGE.min,
    Medical.BP_SYSTOLIC_RANGE.max,
    'Systolic BP',
    'bloodPressureSystolic',
    errors,
  );
  const dia = requireNumber(
    form.bloodPressureDiastolic,
    Medical.BP_DIASTOLIC_RANGE.min,
    Medical.BP_DIASTOLIC_RANGE.max,
    'Diastolic BP',
    'bloodPressureDiastolic',
    errors,
  );
  const activity = requireNumber(
    form.physicalActivityMinutesWeekly,
    Medical.ACTIVITY_RANGE.min,
    Medical.ACTIVITY_RANGE.max,
    'Weekly activity',
    'physicalActivityMinutesWeekly',
    errors,
  );
  const waist = optionalNumber(
    form.waistCircumferenceCm,
    Medical.WAIST_RANGE.min,
    Medical.WAIST_RANGE.max,
    'Waist',
    'waistCircumferenceCm',
    errors,
  );

  if (form.smokingStatus !== 'never' && form.smokingStatus !== 'former' && form.smokingStatus !== 'current') {
    errors.smokingStatus = 'Select a smoking status';
  }

  if (Object.keys(errors).length > 0) throw new ScanValidationError('Please fix the highlighted fields.', errors);

  return {
    age,
    gender,
    bmi,
    bloodGlucoseFasting: glucose,
    hba1c,
    bloodPressureSystolic: sys,
    bloodPressureDiastolic: dia,
    familyHistoryDiabetes: form.familyHistoryDiabetes,
    physicalActivityMinutesWeekly: activity,
    smokingStatus: form.smokingStatus as DiabetesInput['smokingStatus'],
    ...(waist !== undefined ? { waistCircumferenceCm: waist } : {}),
  };
}

export function validateHypertensionForm(form: HypertensionFormState): HypertensionInput {
  const errors: Record<string, string> = {};
  const age = requireNumber(form.age, Medical.AGE_RANGE.min, Medical.AGE_RANGE.max, 'Age', 'age', errors);
  const gender = requireGender(form.gender, 'gender', errors);
  const bmi = requireNumber(form.bmi, Medical.BMI_RANGE.min, Medical.BMI_RANGE.max, 'BMI', 'bmi', errors);
  const sys = requireNumber(
    form.bloodPressureSystolic,
    Medical.BP_SYSTOLIC_RANGE.min,
    Medical.BP_SYSTOLIC_RANGE.max,
    'Systolic BP',
    'bloodPressureSystolic',
    errors,
  );
  const dia = requireNumber(
    form.bloodPressureDiastolic,
    Medical.BP_DIASTOLIC_RANGE.min,
    Medical.BP_DIASTOLIC_RANGE.max,
    'Diastolic BP',
    'bloodPressureDiastolic',
    errors,
  );
  const hr = requireNumber(form.heartRate, Medical.HEART_RATE_RANGE.min, Medical.HEART_RATE_RANGE.max, 'Heart rate', 'heartRate', errors);
  const cholesterol = optionalNumber(
    form.cholesterolTotal,
    Medical.CHOLESTEROL_RANGE.min,
    Medical.CHOLESTEROL_RANGE.max,
    'Cholesterol',
    'cholesterolTotal',
    errors,
  );
  const activity = requireNumber(
    form.physicalActivityMinutesWeekly,
    Medical.ACTIVITY_RANGE.min,
    Medical.ACTIVITY_RANGE.max,
    'Weekly activity',
    'physicalActivityMinutesWeekly',
    errors,
  );

  for (const [field, value, label] of [
    ['smokingStatus', form.smokingStatus, 'Smoking status'],
    ['alcoholConsumption', form.alcoholConsumption, 'Alcohol consumption'],
    ['saltIntake', form.saltIntake, 'Salt intake'],
    ['stressLevel', form.stressLevel, 'Stress level'],
  ] as const) {
    if (!value) errors[field] = `Select ${label.toLowerCase()}`;
  }

  if (Object.keys(errors).length > 0) throw new ScanValidationError('Please fix the highlighted fields.', errors);

  return {
    age,
    gender,
    bmi,
    bloodPressureSystolic: sys,
    bloodPressureDiastolic: dia,
    heartRate: hr,
    smokingStatus: form.smokingStatus as HypertensionInput['smokingStatus'],
    alcoholConsumption: form.alcoholConsumption as HypertensionInput['alcoholConsumption'],
    saltIntake: form.saltIntake as HypertensionInput['saltIntake'],
    stressLevel: form.stressLevel as HypertensionInput['stressLevel'],
    familyHistoryHypertension: form.familyHistoryHypertension,
    physicalActivityMinutesWeekly: activity,
    ...(cholesterol !== undefined ? { cholesterolTotal: cholesterol } : {}),
  };
}

export function validateAnemiaForm(form: AnemiaFormState): AnemiaInput {
  const errors: Record<string, string> = {};
  const age = requireNumber(form.age, Medical.AGE_RANGE.min, Medical.AGE_RANGE.max, 'Age', 'age', errors);
  const gender = requireGender(form.gender, 'gender', errors);

  if (Object.keys(errors).length > 0) throw new ScanValidationError('Please fix the highlighted fields.', errors);

  return { age, gender, symptoms: form.symptoms };
}
