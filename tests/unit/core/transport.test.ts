/**
 * Tests for src/core/transport/http.ts, retry.ts, rate-limit.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  executeHttp,
  parseRetryAfter,
  TransportError,
  NetworkError,
  TimeoutError,
  HttpError,
  RateLimitError,
  type HttpRequest,
} from '../../../src/core/transport/http.js';
import { withRetry, isRetryable, computeDelay } from '../../../src/core/transport/retry.js';
import { withRateLimit } from '../../../src/core/transport/rate-limit.js';

// Helper: create mock fetch response
function mockResponse(status: number, body: string, headers: Record<string, string> = {}): Response {
  const headerMap = new Headers(headers);
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: headerMap,
    text: async () => body,
  } as unknown as Response;
}

// Helper: base request
function baseRequest(overrides: Partial<HttpRequest> = {}): HttpRequest {
  return {
    url: 'http://unraid.local:7777/graphql',
    method: 'POST',
    body: '{"query":"{ ping }"}',
    safety: 'S0',
    ...overrides,
  };
}

describe('executeHttp', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns HttpResponse on success (200)', async () => {
    vi.stubGlobal('fetch', async () => mockResponse(200, '{"data":{"ping":true}}'));
    const resp = await executeHttp(baseRequest());
    expect(resp.status).toBe(200);
    expect(resp.body).toBe('{"data":{"ping":true}}');
  });

  it('returns non-2xx status without throwing for 400', async () => {
    vi.stubGlobal('fetch', async () => mockResponse(400, 'bad request'));
    const resp = await executeHttp(baseRequest());
    expect(resp.status).toBe(400);
  });

  it('returns non-2xx status without throwing for 500', async () => {
    vi.stubGlobal('fetch', async () => mockResponse(500, 'server error'));
    const resp = await executeHttp(baseRequest());
    expect(resp.status).toBe(500);
  });

  it('throws RateLimitError on 429 without Retry-After', async () => {
    vi.stubGlobal('fetch', async () => mockResponse(429, 'too many requests'));
    await expect(executeHttp(baseRequest())).rejects.toThrow(RateLimitError);
  });

  it('throws RateLimitError on 429 with Retry-After seconds', async () => {
    vi.stubGlobal('fetch', async () =>
      mockResponse(429, 'too many requests', { 'retry-after': '5' })
    );
    const err = await executeHttp(baseRequest()).catch((e) => e);
    expect(err).toBeInstanceOf(RateLimitError);
    expect((err as RateLimitError).retryAfterMs).toBe(5000);
  });

  it('throws TimeoutError on AbortError', async () => {
    vi.stubGlobal('fetch', async (_url: unknown, init: RequestInit) => {
      // Simulate abort
      const err = new DOMException('The operation was aborted', 'AbortError');
      throw err;
    });
    const req = baseRequest({ timeout: 100 });
    await expect(executeHttp(req)).rejects.toThrow(TimeoutError);
  });

  it('throws NetworkError on generic fetch failure', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new Error('ECONNREFUSED');
    });
    await expect(executeHttp(baseRequest())).rejects.toThrow(NetworkError);
  });

  it('includes response headers in result', async () => {
    vi.stubGlobal('fetch', async () =>
      mockResponse(200, 'ok', { 'x-request-id': 'abc123' })
    );
    const resp = await executeHttp(baseRequest());
    expect(resp.headers['x-request-id']).toBe('abc123');
  });
});

describe('parseRetryAfter', () => {
  it('returns null for null input', () => {
    expect(parseRetryAfter(null)).toBeNull();
  });

  it('parses integer seconds', () => {
    expect(parseRetryAfter('10')).toBe(10_000);
  });

  it('parses decimal seconds', () => {
    expect(parseRetryAfter('2.5')).toBe(2500);
  });

  it('parses HTTP-date in future', () => {
    const future = new Date(Date.now() + 5000).toUTCString();
    const result = parseRetryAfter(future);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(5100);
  });

  it('returns 0 for HTTP-date in the past', () => {
    const past = new Date(Date.now() - 5000).toUTCString();
    expect(parseRetryAfter(past)).toBe(0);
  });

  it('returns null for invalid string', () => {
    expect(parseRetryAfter('not-a-date')).toBeNull();
  });
});

describe('TransportError hierarchy', () => {
  it('NetworkError is a TransportError', () => {
    const e = new NetworkError('fail');
    expect(e).toBeInstanceOf(TransportError);
    expect(e.exitCode).toBe(7);
    expect(e.name).toBe('NetworkError');
  });

  it('TimeoutError is a TransportError', () => {
    const e = new TimeoutError(5000);
    expect(e).toBeInstanceOf(TransportError);
    expect(e.timeoutMs).toBe(5000);
    expect(e.name).toBe('TimeoutError');
  });

  it('HttpError is a TransportError', () => {
    const e = new HttpError(500, 'oops');
    expect(e).toBeInstanceOf(TransportError);
    expect(e.status).toBe(500);
    expect(e.name).toBe('HttpError');
  });

  it('RateLimitError is an HttpError', () => {
    const e = new RateLimitError(2000, 'too many');
    expect(e).toBeInstanceOf(HttpError);
    expect(e.status).toBe(429);
    expect(e.retryAfterMs).toBe(2000);
    expect(e.name).toBe('RateLimitError');
  });
});

describe('isRetryable', () => {
  it('returns true for NetworkError', () => {
    expect(isRetryable(new NetworkError('fail'))).toBe(true);
  });

  it('returns true for TimeoutError', () => {
    expect(isRetryable(new TimeoutError(1000))).toBe(true);
  });

  it('returns true for 5xx HttpError', () => {
    expect(isRetryable(new HttpError(500, 'error'))).toBe(true);
    expect(isRetryable(new HttpError(503, 'unavailable'))).toBe(true);
  });

  it('returns false for 4xx HttpError', () => {
    expect(isRetryable(new HttpError(400, 'bad'))).toBe(false);
    expect(isRetryable(new HttpError(401, 'unauth'))).toBe(false);
    expect(isRetryable(new HttpError(403, 'forbidden'))).toBe(false);
    expect(isRetryable(new HttpError(404, 'not found'))).toBe(false);
  });

  it('returns false for RateLimitError (handled separately)', () => {
    expect(isRetryable(new RateLimitError(null, 'too many'))).toBe(false);
  });

  it('returns false for unknown errors', () => {
    expect(isRetryable(new Error('random'))).toBe(false);
  });
});

describe('computeDelay', () => {
  it('returns base delay on attempt 0 (no jitter)', () => {
    const delay = computeDelay(0, 1000, 0);
    expect(delay).toBe(1000);
  });

  it('doubles each attempt (no jitter)', () => {
    expect(computeDelay(1, 1000, 0)).toBe(2000);
    expect(computeDelay(2, 1000, 0)).toBe(4000);
    expect(computeDelay(3, 1000, 0)).toBe(8000);
  });

  it('adds jitter within expected range', () => {
    for (let i = 0; i < 20; i++) {
      const delay = computeDelay(0, 1000, 0.1);
      expect(delay).toBeGreaterThanOrEqual(1000);
      expect(delay).toBeLessThan(1101);
    }
  });
});

describe('withRetry', () => {
  it('returns result immediately on success', async () => {
    const op = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(op, 'S0', { maxRetries: 3 });
    expect(result).toBe('ok');
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('retries on NetworkError up to maxRetries', async () => {
    const op = vi.fn()
      .mockRejectedValueOnce(new NetworkError('fail'))
      .mockRejectedValueOnce(new NetworkError('fail'))
      .mockResolvedValue('ok');
    const sleep = vi.fn().mockResolvedValue(undefined);
    const result = await withRetry(op, 'S0', { maxRetries: 3, baseDelayMs: 100, sleep });
    expect(result).toBe('ok');
    expect(op).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('retries on TimeoutError', async () => {
    const op = vi.fn()
      .mockRejectedValueOnce(new TimeoutError(1000))
      .mockResolvedValue('ok');
    const sleep = vi.fn().mockResolvedValue(undefined);
    const result = await withRetry(op, 'S0', { maxRetries: 3, baseDelayMs: 100, sleep });
    expect(result).toBe('ok');
    expect(op).toHaveBeenCalledTimes(2);
  });

  it('retries on 500 HttpError', async () => {
    const op = vi.fn()
      .mockRejectedValueOnce(new HttpError(500, 'server error'))
      .mockResolvedValue('ok');
    const sleep = vi.fn().mockResolvedValue(undefined);
    const result = await withRetry(op, 'S0', { maxRetries: 3, baseDelayMs: 100, sleep });
    expect(result).toBe('ok');
  });

  it('throws after maxRetries exhausted', async () => {
    const netErr = new NetworkError('fail');
    const op = vi.fn().mockRejectedValue(netErr);
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(withRetry(op, 'S0', { maxRetries: 2, baseDelayMs: 10, sleep })).rejects.toThrow(NetworkError);
    expect(op).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('does NOT retry on 400 HttpError', async () => {
    const op = vi.fn().mockRejectedValue(new HttpError(400, 'bad request'));
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(withRetry(op, 'S0', { maxRetries: 3, baseDelayMs: 10, sleep })).rejects.toThrow(HttpError);
    expect(op).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('does NOT retry on 401 HttpError', async () => {
    const op = vi.fn().mockRejectedValue(new HttpError(401, 'unauthorized'));
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(withRetry(op, 'S0', { maxRetries: 3, baseDelayMs: 10, sleep })).rejects.toThrow(HttpError);
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry on 403 HttpError', async () => {
    const op = vi.fn().mockRejectedValue(new HttpError(403, 'forbidden'));
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(withRetry(op, 'S0', { maxRetries: 3, baseDelayMs: 10, sleep })).rejects.toThrow(HttpError);
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry write operations (S1)', async () => {
    const op = vi.fn().mockRejectedValue(new NetworkError('fail'));
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(withRetry(op, 'S1', { maxRetries: 3, baseDelayMs: 10, sleep })).rejects.toThrow(NetworkError);
    expect(op).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('does NOT retry write operations (S2)', async () => {
    const op = vi.fn().mockRejectedValue(new NetworkError('fail'));
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(withRetry(op, 'S2', { maxRetries: 3, baseDelayMs: 10, sleep })).rejects.toThrow(NetworkError);
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry write operations (S3)', async () => {
    const op = vi.fn().mockRejectedValue(new NetworkError('fail'));
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(withRetry(op, 'S3', { maxRetries: 3, baseDelayMs: 10, sleep })).rejects.toThrow(NetworkError);
    expect(op).toHaveBeenCalledTimes(1);
  });
});

describe('withRateLimit', () => {
  it('returns result immediately when no rate limit', async () => {
    const op = vi.fn().mockResolvedValue('data');
    const result = await withRateLimit(op, { maxRetries: 2 });
    expect(result).toBe('data');
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('retries on RateLimitError with sleep', async () => {
    const op = vi.fn()
      .mockRejectedValueOnce(new RateLimitError(500, 'too many'))
      .mockResolvedValue('ok');
    const sleep = vi.fn().mockResolvedValue(undefined);
    const result = await withRateLimit(op, { maxRetries: 3, sleep });
    expect(result).toBe('ok');
    expect(sleep).toHaveBeenCalledWith(500);
    expect(op).toHaveBeenCalledTimes(2);
  });

  it('uses defaultBackoffMs when retryAfterMs is null', async () => {
    const op = vi.fn()
      .mockRejectedValueOnce(new RateLimitError(null, 'too many'))
      .mockResolvedValue('ok');
    const sleep = vi.fn().mockResolvedValue(undefined);
    await withRateLimit(op, { maxRetries: 3, defaultBackoffMs: 2000, sleep });
    expect(sleep).toHaveBeenCalledWith(2000);
  });

  it('throws after maxRetries exceeded', async () => {
    const op = vi.fn().mockRejectedValue(new RateLimitError(10, 'too many'));
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(withRateLimit(op, { maxRetries: 2, sleep })).rejects.toThrow(RateLimitError);
    expect(op).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('propagates non-rate-limit errors immediately', async () => {
    const op = vi.fn().mockRejectedValue(new NetworkError('fail'));
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(withRateLimit(op, { maxRetries: 3, sleep })).rejects.toThrow(NetworkError);
    expect(op).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });
});
