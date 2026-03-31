import { EXIT_CODE_RUNTIME_ERROR, type UcliExitCode } from './codes.js';
import { GraphQLResponseError, isUcliError } from './graphql-errors.js';
import { HttpError, NetworkError, RateLimitError, TimeoutError, TransportError } from './transport-errors.js';

export interface FormatUserErrorOptions {
  debug?: boolean;
}

export function getExitCode(error: unknown): UcliExitCode {
  if (isUcliError(error)) {
    return error.exitCode;
  }

  return EXIT_CODE_RUNTIME_ERROR;
}

export function formatUserError(error: unknown, options: FormatUserErrorOptions = {}): string {
  const message = buildMessage(error);
  const parts = [message];

  if (options.debug && error instanceof Error) {
    parts.push(error.stack ?? error.message);
  }

  return `${parts.filter(Boolean).join('\n')}\n`;
}

export function writeUserError(error: unknown, options: FormatUserErrorOptions = {}): void {
  process.stderr.write(formatUserError(error, options));
}

function buildMessage(error: unknown): string {
  if (error instanceof GraphQLResponseError) {
    const requestSuffix = error.requestId ? ` (request ${error.requestId})` : '';
    return `GraphQL error${requestSuffix}: ${error.errors.map((entry) => entry.message).join('; ')}`;
  }

  if (error instanceof RateLimitError) {
    return error.retryAfterMs === null
      ? 'Transport error: rate limit exceeded'
      : `Transport error: rate limit exceeded, retry after ${error.retryAfterMs}ms`;
  }

  if (error instanceof TimeoutError) {
    return `Transport error: request timed out after ${error.timeoutMs}ms`;
  }

  if (error instanceof NetworkError) {
    return `Transport error: ${error.message}`;
  }

  if (error instanceof HttpError) {
    return `Transport error: HTTP ${error.status}`;
  }

  if (error instanceof TransportError) {
    return `Transport error: ${error.message}`;
  }

  if (isUcliError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return `Runtime error: ${error.message}`;
  }

  return `Runtime error: ${String(error)}`;
}
