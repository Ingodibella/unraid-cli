/**
 * Retry logic for S0 (read-only) HTTP operations.
 *
 * Write operations (S1-S3) are NEVER retried automatically.
 * Retry is triggered on: network errors, 5xx status codes, timeouts.
 * Retry is NOT triggered on: 4xx (except 429 handled by rate-limit), GraphQL errors.
 */

import type { SafetyClass } from './http.js';
import { NetworkError, TimeoutError, HttpError, RateLimitError } from './http.js';

export interface RetryOptions {
  /** Maximum number of retry attempts (default 3) */
  maxRetries?: number;
  /** Base delay in ms before first retry (default 1000) */
  baseDelayMs?: number;
  /** Optional jitter factor 0-1 (default 0.1) */
  jitter?: number;
  /** Optional sleep function for testability */
  sleep?: (ms: number) => Promise<void>;
}

/** Computes exponential backoff delay with jitter */
export function computeDelay(
  attempt: number,
  baseDelayMs: number,
  jitter: number
): number {
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const jitterAmount = exponential * jitter * Math.random();
  return Math.floor(exponential + jitterAmount);
}

/** Returns true if the error should trigger a retry */
export function isRetryable(err: unknown): boolean {
  if (err instanceof RateLimitError) return false; // handled by rate-limit module
  if (err instanceof NetworkError) return true;
  if (err instanceof TimeoutError) return true;
  if (err instanceof HttpError && err.status >= 500) return true;
  return false;
}

/**
 * Wraps an async operation with retry logic.
 * Only retries if safety is 'S0'.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  safety: SafetyClass,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1_000,
    jitter = 0.1,
    sleep = defaultSleep,
  } = options;

  // Write operations are never retried
  if (safety !== 'S0') {
    return operation();
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err: unknown) {
      lastError = err;
      if (!isRetryable(err) || attempt === maxRetries) {
        throw err;
      }
      const delay = computeDelay(attempt, baseDelayMs, jitter);
      await sleep(delay);
    }
  }

  throw lastError;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
