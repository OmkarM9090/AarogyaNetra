/**
 * Central axios client for the AarogyaNetra API.
 *
 *  - Base URL from environment config (see shared/constants/config.ts)
 *  - Request interceptor attaches the JWT access token
 *  - Response interceptor handles 401 → refresh → retry
 *  - 30 s timeout (60 s for uploads)
 *  - Request/response logging in __DEV__
 */
import axios, { AxiosError } from 'axios';

import { Config } from '../../constants/config';
import type { NormalizedApiError } from '../../types/api';
import { installInterceptors } from './interceptors';

export const apiClient = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: Config.API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

// Wire interceptors. Session callbacks are attached by the auth store at
// startup (see features/auth/store/authStore.ts) to avoid a circular import.
export function bindAuthCallbacks(options: {
  onRefreshed?: (tokens: { accessToken: string; refreshToken: string }) => void;
  onSessionExpired?: () => void;
}): void {
  installInterceptors(apiClient, options);
}

/** Uploads use a longer timeout. */
export function uploadConfig() {
  return { timeout: Config.UPLOAD_TIMEOUT_MS };
}

/**
 * Normalize any thrown error into a UI-friendly NormalizedApiError.
 */
export function toNormalizedError(e: unknown): NormalizedApiError {
  const axiosErr = e as AxiosError<{ error?: { code?: string; message?: string; details?: Record<string, unknown> } }>;

  if (axiosErr?.response) {
    const status = axiosErr.response.status;
    const data = axiosErr.response.data;
    const code = data?.error?.code ?? 'unknown';
    const message = data?.error?.message ?? axiosErr.message;
    const details = data?.error?.details ?? {};

    if (status === 401) {
      return { kind: 'unauthorized', code, message, status };
    }
    if (status === 403) {
      return { kind: 'unauthorized', code, message, status };
    }
    if (status === 404) {
      return { kind: 'not_found', code, message, status };
    }
    if (status === 413) {
      return { kind: 'validation', code, message: 'Image is too large', status };
    }
    if (status === 429) {
      return { kind: 'server', code, message: 'Too many requests. Please wait a moment and retry.', status };
    }
    if (status === 400 || status === 422) {
      // FastAPI validation errors arrive as details = { field: [messages] }
      const fieldErrors: Record<string, string> = {};
      Object.entries(details).forEach(([field, value]) => {
        if (Array.isArray(value)) {
          fieldErrors[field] = value.map(v => String(v).replace(/^.*?\s"([^"]+)"\.\s*$/, '$1')).join('; ');
        } else {
          fieldErrors[field] = String(value);
        }
      });
      return { kind: 'validation', code, message, status, fieldErrors };
    }
    if (code === 'MODEL_NOT_LOADED' || code === 'MODEL_UNAVAILABLE') {
      return { kind: 'model_unavailable', code, message, status };
    }
    if (status && status >= 500) {
      return { kind: 'server', code, message, status };
    }
    return { kind: 'server', code, message, status };
  }

  if (axiosErr?.code === 'ECONNABORTED' || axiosErr?.message?.includes('timeout')) {
    return { kind: 'timeout', code: 'timeout', message: 'The request timed out. Please try again.' };
  }
  if (axiosErr?.message === 'Network Error' || axiosErr?.message === 'Network error') {
    return {
      kind: 'network',
      code: 'network',
      message: 'Cannot connect to server. Check your connection.',
    };
  }
  return { kind: 'unknown', code: 'unknown', message: 'Something went wrong. Please try again.' };
}
