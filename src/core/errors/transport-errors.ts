import { EXIT_CODE_TRANSPORT_ERROR } from './codes.js';
import { AuthError, AuthorizationError, ConflictError, NotFoundError, UcliError } from './graphql-errors.js';

export class TransportError extends UcliError {
  constructor(message: string, public readonly cause?: unknown) {
    super(message, EXIT_CODE_TRANSPORT_ERROR, cause);
    this.name = 'TransportError';
  }
}

export class NetworkError extends TransportError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends TransportError {
  constructor(public readonly timeoutMs: number, cause?: unknown) {
    super(`Request timed out after ${timeoutMs}ms`, cause);
    this.name = 'TimeoutError';
  }
}

export class HttpError extends TransportError {
  constructor(
    public readonly status: number,
    public readonly responseBody: string,
    cause?: unknown,
  ) {
    super(`HTTP ${status}`, cause);
    this.name = 'HttpError';
  }
}

export class RateLimitError extends HttpError {
  constructor(
    public readonly retryAfterMs: number | null,
    responseBody: string,
    cause?: unknown,
  ) {
    super(429, responseBody, cause);
    this.name = 'RateLimitError';
  }
}

export function normalizeTransportError(error: unknown): UcliError {
  if (error instanceof UcliError) {
    return error;
  }

  if (isAbortError(error)) {
    return new TimeoutError(30_000, error);
  }

  if (isFetchLikeError(error)) {
    return new NetworkError(error.message, error);
  }

  return new TransportError(
    error instanceof Error ? error.message : 'Transport request failed',
    error,
  );
}

export function normalizeHttpError(status: number, responseBody: string, cause?: unknown): UcliError {
  if (status === 401) {
    return new AuthError('Authentication failed', { status, responseBody, cause });
  }

  if (status === 403) {
    return new AuthorizationError('Authorization failed', { status, responseBody, cause });
  }

  if (status === 404) {
    return new NotFoundError('Resource not found', { status, responseBody, cause });
  }

  if (status === 409) {
    return new ConflictError('Conflict', { status, responseBody, cause });
  }

  return new HttpError(status, responseBody, cause);
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'));
}

function isFetchLikeError(error: unknown): error is Error {
  return error instanceof Error;
}
