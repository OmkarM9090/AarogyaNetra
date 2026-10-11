/**
 * Validation helpers — local pre-flight checks before hitting the API.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/** Minimum password policy (mirrors backend). */
export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 8) issues.push('At least 8 characters');
  if (password.length > 128) issues.push('At most 128 characters');
  if (!/[A-Za-z]/.test(password)) issues.push('At least one letter');
  if (!/[0-9]/.test(password)) issues.push('At least one number');
  return issues;
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/[\s\-+()]/g, '');
  return /^\d{7,15}$/.test(digits);
}

export interface RangeCheckResult {
  ok: boolean;
  error?: string;
}

export function inRange(
  value: number,
  min: number,
  max: number,
  label: string,
): RangeCheckResult {
  if (Number.isNaN(value)) return { ok: false, error: `${label} is required` };
  if (value < min || value > max) {
    return { ok: false, error: `${label} must be between ${min} and ${max}` };
  }
  return { ok: true };
}

export function requiredText(value: string, label: string): RangeCheckResult {
  if (!value.trim()) return { ok: false, error: `${label} is required` };
  return { ok: true };
}

/** Parse a numeric field from a TextInput (empty → NaN). */
export function toNumber(value: string): number {
  if (value.trim() === '') return NaN;
  return Number(value);
}
