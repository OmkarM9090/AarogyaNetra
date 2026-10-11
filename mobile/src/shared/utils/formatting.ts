/**
 * Formatting helpers.
 */

export function formatPercent(fraction: number, digits = 0): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

export function formatScore(score0to100: number, digits = 0): string {
  return score0to100.toFixed(digits);
}

export function formatNumber(value: number, maxDigits = 1): string {
  return Number(value).toLocaleString('en-IN', { maximumFractionDigits: maxDigits });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]!.toUpperCase())
    .join('');
}
