/**
 * Auth feature types (re-exports + feature-local additions).
 */
export type {
  BloodGroup,
  Gender,
  ProfileUpdate,
  RegisterData,
  TokenPair,
  User,
} from '../../shared/types/user';

/** Fields captured during registration (onboarding-style). */
export interface RegisterFormState {
  fullName: string;
  email: string;
  password: string;
  confirm: string;
  phone: string;
  dateOfBirth: string; // yyyy-mm-dd (empty = skip)
  gender: 'male' | 'female' | '';
  heightCm: string;
  weightKg: string;
}

export const EMPTY_REGISTER_FORM: RegisterFormState = {
  fullName: '',
  email: '',
  password: '',
  confirm: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  heightCm: '',
  weightKg: '',
};
