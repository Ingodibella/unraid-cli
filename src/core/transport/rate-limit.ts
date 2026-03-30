/**
 * Rate limit handling for ucli HTTP transport.
 *
 * Unraid API uses nestjs/throttler: 100 req / 10s.
 * Detects 429 responses and implements backoff respecting Retry-After header.
 */

import { RateLimitError } from './http.js';

export interface RateLimitOptions {
  /** Default backoff when no Retry-After header present, in ms (default 10000) */
  defaultBackoffMs?: number;
  /** Maximum number of rate-limit retries (default 3) */
  maxRetries?: number;
  /** Optional sleep function for testability */
  sleep?: (ms: number) => Promise<void>;
}

/**
 * Wraps an operation with rate-limit backoff.
 * On 429: wait for Retry-After (or defaultBackoffMs), then retry.
 */
export async function withRateLimit<T>(
  operation: () => Promise<T>,
  options: RateLimitOptions = {}
): Promise<T> {
  const {
    defaultBackoffMs = 10_000,
    maxRetries = 3,
    sleep = defaultSleep,
  } = options;

  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (err: unknown) {
      if (err instanceof RateLimitError && attempt < maxRetries) {
        const waitMs = err.retryAfterMs ?? defaultBackoffMs;
        await sleep(waitMs);
        attempt++;
      } else {
        throw err;
      }
    }
  }
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
