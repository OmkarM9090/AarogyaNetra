/**
 * Scanner feature types.
 */
import type {
  AnemiaInput,
  AnemiaSymptom,
  DiabetesInput,
  HypertensionInput,
} from '../../shared/types/prediction';

export type ScanCondition = 'diabetes' | 'hypertension' | 'anemia';

export const SCAN_CONDITIONS: ScanCondition[] = ['diabetes', 'hypertension', 'anemia'];

/** Form state for the diabetes screening form. */
export interface DiabetesFormState {
  age: string;
  gender: 'male' | 'female' | '';
  bmi: string;
  bloodGlucoseFasting: string;
  hba1c: string;
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  familyHistoryDiabetes: boolean;
  physicalActivityMinutesWeekly: string;
  smokingStatus: 'never' | 'former' | 'current' | '';
  waistCircumferenceCm: string;
}

export const EMPTY_DIABETES_FORM: DiabetesFormState = {
  age: '',
  gender: '',
  bmi: '',
  bloodGlucoseFasting: '',
  hba1c: '',
  bloodPressureSystolic: '',
  bloodPressureDiastolic: '',
  familyHistoryDiabetes: false,
  physicalActivityMinutesWeekly: '',
  smokingStatus: '',
  waistCircumferenceCm: '',
};

/** Form state for the hypertension screening form. */
export interface HypertensionFormState {
  age: string;
  gender: 'male' | 'female' | '';
  bmi: string;
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRate: string;
  cholesterolTotal: string;
  smokingStatus: 'never' | 'former' | 'current' | '';
  alcoholConsumption: 'none' | 'moderate' | 'heavy' | '';
  saltIntake: 'low' | 'moderate' | 'high' | '';
  stressLevel: 'low' | 'moderate' | 'high' | '';
  familyHistoryHypertension: boolean;
  physicalActivityMinutesWeekly: string;
}

export const EMPTY_HYPERTENSION_FORM: HypertensionFormState = {
  age: '',
  gender: '',
  bmi: '',
  bloodPressureSystolic: '',
  bloodPressureDiastolic: '',
  heartRate: '',
  cholesterolTotal: '',
  smokingStatus: '',
  alcoholConsumption: '',
  saltIntake: '',
  stressLevel: '',
  familyHistoryHypertension: false,
  physicalActivityMinutesWeekly: '',
};

/** Form state for the anemia screening (demographics + symptoms). */
export interface AnemiaFormState {
  age: string;
  gender: 'male' | 'female' | '';
  symptoms: AnemiaSymptom[];
}

export const EMPTY_ANEMIA_FORM: AnemiaFormState = {
  age: '',
  gender: '',
  symptoms: [],
};

export type ScannerFormState =
  | { condition: 'diabetes'; form: DiabetesFormState }
  | { condition: 'hypertension'; form: HypertensionFormState }
  | { condition: 'anemia'; form: AnemiaFormState };

/**
 * Preflight the scanner forms locally and produce the typed API payloads.
 * Throws a ScanValidationError with fieldErrors when invalid.
 */
export class ScanValidationError extends Error {
  fieldErrors: Record<string, string>;
  constructor(message: string, fieldErrors: Record<string, string>) {
    super(message);
    this.name = 'ScanValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export { AnemiaInput, DiabetesInput, HypertensionInput };
