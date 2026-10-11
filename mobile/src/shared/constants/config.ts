/**
 * Runtime configuration — environment driven.
 *
 * Values come from .env files via @react-native-dotenv (see babel.config.js):
 *   .env.development → API_BASE_URL=http://10.0.2.2:8000/api/v1   (Android emulator)
 *   .env.production  → API_BASE_URL=https://your-server.com/api/v1
 *
 * The defaults below match those files, so the app also works if the dotenv
 * plugin is not configured.
 */
import { Platform } from 'react-native';
import type { BloodGroup } from '../types/user';
import { env } from './env';

/** Inlined from .env.development / .env.production by the env-inline babel plugin. */
const ENV_BASE_URL = env.API_BASE_URL || '';

function defaultBaseUrl(): string {
  // Android emulator reaches the host machine via 10.0.2.2
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000/api/v1';
  if (Platform.OS === 'ios') return 'http://localhost:8000/api/v1';
  return 'http://10.0.2.2:8000/api/v1';
}

export const Config = {
  API_BASE_URL: ENV_BASE_URL || defaultBaseUrl(),
  /** Standard request timeout (ms). */
  API_TIMEOUT_MS: 30_000,
  /** Longer timeout for eye-image uploads. */
  UPLOAD_TIMEOUT_MS: 60_000,
  /** Maximum eye image size to upload (bytes). 5 MB. */
  MAX_IMAGE_UPLOAD_BYTES: 5 * 1024 * 1024,
  /** Minimum sane image size (bytes) — rejects corrupt/empty captures. */
  MIN_IMAGE_BYTES: 20 * 1024,
  /** Page size used for list endpoints. */
  LIST_PAGE_SIZE: 20,
  BLOOD_GROUPS: [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
  ] as BloodGroup[],
};
