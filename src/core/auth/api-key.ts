/**
 * API key validation for ucli.
 */

/**
 * Validates that an API key is a non-empty string.
 * Returns true if valid, false otherwise.
 */
export function isValidApiKey(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Normalizes an API key by trimming whitespace.
 */
export function normalizeApiKey(value: string): string {
  return value.trim();
}
