/**
 * User / auth domain types — mirror of the backend users collection.
 */

export type Gender = 'male' | 'female';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  dateOfBirth?: string | null; // ISO date
  gender?: Gender | null;
  bloodGroup?: BloodGroup | null;
  heightCm?: number | null;
  weightKg?: number | null;
  medicalHistory: string[];
  disclaimerAcknowledged: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  heightCm?: number;
  weightKg?: number;
}

export interface ProfileUpdate {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  heightCm?: number;
  weightKg?: number;
  medicalHistory?: string[];
  disclaimerAcknowledged?: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
