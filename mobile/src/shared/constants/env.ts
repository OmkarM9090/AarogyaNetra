/**
 * Build-time environment variables.
 *
 * The values here are safe fallbacks. At bundle time, the `env-inline` babel
 * plugin (see babel.config.js) replaces `env.API_BASE_URL` references with the
 * literal value from .env.development or .env.production.
 */
export const env: Record<string, string> = {
  API_BASE_URL: '',
};
