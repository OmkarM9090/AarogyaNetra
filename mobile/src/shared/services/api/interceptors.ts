/**
 * Axios interceptors:
 *  - request: attach the JWT access token from storage
 *  - response: on 401 try one refresh; retry the original request once;
 *    on refresh failure clear tokens (the auth store reacts to logout)
 */
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { storageService, STORAGE_KEYS } from '../storage/asyncStorageService';
import { API } from './endpoints';

export interface AuthApiLike {
  login: (email: string, password: string) => Promise<unknown>;
  refresh: (refreshToken: string) => Promise<{ accessToken: string; refreshToken: string }>;
}

let refreshPromise: Promise<string | null> | null = null;

export interface InterceptorOptions {
  /** Called with the fresh token pair after a successful refresh. */
  onRefreshed?: (tokens: { accessToken: string; refreshToken: string }) => void;
  /** Called when the session is unrecoverably lost. */
  onSessionExpired?: () => void;
}

async function tryRefresh(config: InternalAxiosRequestConfig, options: InterceptorOptions): Promise<string | null> {
  // De-duplicate concurrent 401s into a single refresh call.
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const refreshToken = await storageService.getString(STORAGE_KEYS.REFRESH_TOKEN);
        if (!refreshToken) return null;
        const { apiClient } = await import('./apiClient');
        const { data } = await apiClient.post<{ success: true; data: { accessToken: string; refreshToken: string } }>(
          API.auth.refresh,
          { refreshToken },
          { headers: { 'x-auth-refresh': '1' } as Record<string, string> },
        );
        const tokens = data.data;
        await Promise.all([
          storageService.setString(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
          storageService.setString(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
        ]);
        options.onRefreshed?.(tokens);
        return tokens.accessToken;
      } catch (e) {
        console.warn('[api] refresh failed', e);
        await Promise.all([
          storageService.remove(STORAGE_KEYS.ACCESS_TOKEN),
          storageService.remove(STORAGE_KEYS.REFRESH_TOKEN),
        ]);
        options.onSessionExpired?.();
        return null;
      }
    })();
    refreshPromise.finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export function installInterceptors(
  apiClient: AxiosInstance,
  options: InterceptorOptions = {},
): void {
  apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await storageService.getString(STORAGE_KEYS.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (__DEV__) {
      console.log(`[api] → ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  });

  apiClient.interceptors.response.use(
    (response) => {
      if (__DEV__) {
        console.log(`[api] ← ${response.status} ${response.config?.url}`);
      }
      return response;
    },
    async (error: AxiosError) => {
      const config = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
      const status = error.response?.status;
      const url = config?.url ?? '';

      // Only retry auth-protected requests, once, and never the refresh call itself.
      const isRefreshCall = url === API.auth.refresh || !!config?.headers?.['x-auth-refresh'];
      const isAuthCall = url === API.auth.login || url === API.auth.register;
      if (status === 401 && config && !config._retry && !isRefreshCall && !isAuthCall) {
        config._retry = true;
        const newToken = await tryRefresh(config, options);
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(config);
        }
      }

      if (__DEV__) {
        console.warn(`[api] ← error ${status ?? 'network'} ${url}`, error.message);
      }
      return Promise.reject(error);
    },
  );
}
