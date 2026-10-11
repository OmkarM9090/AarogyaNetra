/**
 * API endpoint paths — all relative to the configured base URL.
 */

export const API = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    me: '/auth/me',
  },
  scans: {
    diabetes: '/scans/diabetes',
    hypertension: '/scans/hypertension',
    anemia: '/scans/anemia',
    list: '/scans',
    detail: (id: string) => `/scans/${id}`,
  },
  predictions: {
    list: '/predictions',
    detail: (id: string) => `/predictions/${id}`,
    summary: '/predictions/summary',
  },
  health: '/health',
} as const;
