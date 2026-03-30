/**
 * HTTP transport types and normalized error classes for ucli.
 *
 * All HTTP-level errors are normalized to TransportError subtypes.
 * stdout = data, stderr = prose (no logging here, callers handle that).
 */

/** Safety class for an operation: read-only vs mutating */
export type SafetyClass = 'S0' | 'S1' | 'S2' | 'S3';

/** Raw HTTP request descriptor */
export interface HttpRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  /** Safety class determines retry eligibility */
  safety: SafetyClass;
  /** Timeout in ms, defaults to 30000 */
  timeout?: number;
}

/** Raw HTTP response */
export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

/** Base transport error */
export class TransportError extends Error {
  readonly exitCode = 7;
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'TransportError';
  }
}

/** Network-level error (DNS failure, connection refused, etc.) */
export class NetworkError extends TransportError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'NetworkError';
  }
}

/** Request timed out */
export class TimeoutError extends TransportError {
  constructor(public readonly timeoutMs: number, cause?: unknown) {
    super(`Request timed out after ${timeoutMs}ms`, cause);
    this.name = 'TimeoutError';
  }
}

/** Non-2xx HTTP response */
export class HttpError extends TransportError {
  constructor(
    public readonly status: number,
    public readonly responseBody: string,
    cause?: unknown
  ) {
    super(`HTTP ${status}`, cause);
    this.name = 'HttpError';
  }
}

/** 429 rate-limit response */
export class RateLimitError extends HttpError {
  constructor(
    public readonly retryAfterMs: number | null,
    responseBody: string,
    cause?: unknown
  ) {
    super(429, responseBody, cause);
    this.name = 'RateLimitError';
  }
}

/**
 * Execute a single HTTP request. Returns HttpResponse on success.
 * Throws TransportError subtypes on failure.
 */
export async function executeHttp(req: HttpRequest): Promise<HttpResponse> {
  const timeoutMs = req.timeout ?? 30_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let raw: Response;
  try {
    raw = await fetch(req.url, {
      method: req.method,
      headers: req.headers,
      body: req.body,
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timer);
    if (isAbortError(err)) {
      throw new TimeoutError(timeoutMs, err);
    }
    throw new NetworkError(
      err instanceof Error ? err.message : 'Network request failed',
      err
    );
  } finally {
    clearTimeout(timer);
  }

  const responseHeaders: Record<string, string> = {};
  raw.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  const body = await raw.text();

  if (raw.status === 429) {
    const retryAfterMs = parseRetryAfter(raw.headers.get('retry-after'));
    throw new RateLimitError(retryAfterMs, body);
  }

  return {
    status: raw.status,
    headers: responseHeaders,
    body,
  };
}

/** Parse Retry-After header into milliseconds */
export function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = parseFloat(value);
  if (!Number.isNaN(seconds)) return Math.ceil(seconds * 1000);
  // HTTP-date format
  const date = Date.parse(value);
  if (!Number.isNaN(date)) {
    const diff = date - Date.now();
    return diff > 0 ? diff : 0;
  }
  return null;
}

function isAbortError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === 'AbortError' || err.message.includes('aborted'))
  );
}
