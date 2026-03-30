import { describe, it, expect, vi, afterEach } from 'vitest';

import {
  EXIT_CODE_AUTH_FAILURE,
  EXIT_CODE_AUTHORIZATION_FAILURE,
  EXIT_CODE_CONFIRMATION_CANCELLED,
  EXIT_CODE_CONFLICT,
  EXIT_CODE_GRAPHQL_ERROR,
  EXIT_CODE_INVALID_USAGE,
  EXIT_CODE_NOT_FOUND,
  EXIT_CODE_PARTIAL_FAILURE,
  EXIT_CODE_RUNTIME_ERROR,
  EXIT_CODE_SUCCESS,
  EXIT_CODE_TRANSPORT_ERROR,
  type UcliExitCode,
} from '../../../src/core/errors/codes.js';
import {
  AuthError,
  AuthorizationError,
  ConfirmationCancelledError,
  ConflictError,
  GraphQLResponseError,
  InvalidUsageError,
  NotFoundError,
  PartialFailureError,
  UcliError,
  normalizeGraphQLErrors,
} from '../../../src/core/errors/graphql-errors.js';
import {
  HttpError,
  NetworkError,
  RateLimitError,
  TimeoutError,
  TransportError,
  normalizeHttpError,
  normalizeTransportError,
} from '../../../src/core/errors/transport-errors.js';
import { formatUserError, getExitCode, writeUserError } from '../../../src/core/errors/user-errors.js';

describe('exit code constants', () => {
  it('exports all expected exit codes from 0 to 10', () => {
    const values: UcliExitCode[] = [
      EXIT_CODE_SUCCESS,
      EXIT_CODE_RUNTIME_ERROR,
      EXIT_CODE_INVALID_USAGE,
      EXIT_CODE_AUTH_FAILURE,
      EXIT_CODE_AUTHORIZATION_FAILURE,
      EXIT_CODE_NOT_FOUND,
      EXIT_CODE_CONFLICT,
      EXIT_CODE_TRANSPORT_ERROR,
      EXIT_CODE_GRAPHQL_ERROR,
      EXIT_CODE_PARTIAL_FAILURE,
      EXIT_CODE_CONFIRMATION_CANCELLED,
    ];

    expect(values).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

describe('typed errors', () => {
  it('assigns invalid usage errors to exit code 2', () => {
    expect(new InvalidUsageError('bad flag').exitCode).toBe(EXIT_CODE_INVALID_USAGE);
  });

  it('assigns auth errors to exit code 3', () => {
    expect(new AuthError('bad key').exitCode).toBe(EXIT_CODE_AUTH_FAILURE);
  });

  it('assigns authorization errors to exit code 4', () => {
    expect(new AuthorizationError('forbidden').exitCode).toBe(EXIT_CODE_AUTHORIZATION_FAILURE);
  });

  it('assigns not found errors to exit code 5', () => {
    expect(new NotFoundError('missing').exitCode).toBe(EXIT_CODE_NOT_FOUND);
  });

  it('assigns conflict errors to exit code 6', () => {
    expect(new ConflictError('conflict').exitCode).toBe(EXIT_CODE_CONFLICT);
  });

  it('assigns GraphQL response errors to exit code 8', () => {
    expect(new GraphQLResponseError([{ message: 'boom' }]).exitCode).toBe(EXIT_CODE_GRAPHQL_ERROR);
  });

  it('assigns partial failure errors to exit code 9', () => {
    expect(new PartialFailureError('partial').exitCode).toBe(EXIT_CODE_PARTIAL_FAILURE);
  });

  it('assigns confirmation cancelled errors to exit code 10', () => {
    expect(new ConfirmationCancelledError().exitCode).toBe(EXIT_CODE_CONFIRMATION_CANCELLED);
  });

  it('assigns transport errors to exit code 7', () => {
    expect(new TransportError('offline').exitCode).toBe(EXIT_CODE_TRANSPORT_ERROR);
  });
});

describe('normalizeGraphQLErrors', () => {
  it('maps 401 responses to AuthError', () => {
    const error = normalizeGraphQLErrors({ status: 401, errors: [{ message: 'bad key' }] });
    expect(error).toBeInstanceOf(AuthError);
    expect(error.exitCode).toBe(EXIT_CODE_AUTH_FAILURE);
  });

  it('maps FORBIDDEN extension codes to AuthorizationError', () => {
    const error = normalizeGraphQLErrors({
      errors: [{ message: 'forbidden', extensions: { code: 'FORBIDDEN' } }],
    });
    expect(error).toBeInstanceOf(AuthorizationError);
    expect(error.exitCode).toBe(EXIT_CODE_AUTHORIZATION_FAILURE);
  });

  it('maps NOT_FOUND extension codes to NotFoundError', () => {
    const error = normalizeGraphQLErrors({
      errors: [{ message: 'missing', extensions: { code: 'NOT_FOUND' } }],
    });
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.exitCode).toBe(EXIT_CODE_NOT_FOUND);
  });

  it('maps 409 responses to ConflictError', () => {
    const error = normalizeGraphQLErrors({ status: 409, errors: [{ message: 'race' }] });
    expect(error).toBeInstanceOf(ConflictError);
    expect(error.exitCode).toBe(EXIT_CODE_CONFLICT);
  });

  it('returns GraphQLResponseError for general GraphQL failures', () => {
    const error = normalizeGraphQLErrors(
      {
        errors: [
          { message: 'first', path: ['system'], locations: [{ line: 1, column: 2 }] },
          { message: 'second' },
        ],
      },
      'req-123',
    );

    expect(error).toBeInstanceOf(GraphQLResponseError);
    expect(error.exitCode).toBe(EXIT_CODE_GRAPHQL_ERROR);
    expect((error as GraphQLResponseError).requestId).toBe('req-123');
  });
});

describe('normalizeTransportError', () => {
  it('preserves existing ucli errors', () => {
    const error = new UcliError('known', EXIT_CODE_NOT_FOUND);
    expect(normalizeTransportError(error)).toBe(error);
  });

  it('maps abort errors to TimeoutError', () => {
    const error = normalizeTransportError(new DOMException('The operation was aborted', 'AbortError'));
    expect(error).toBeInstanceOf(TimeoutError);
    expect(error.exitCode).toBe(EXIT_CODE_TRANSPORT_ERROR);
  });

  it('maps generic Error instances to NetworkError', () => {
    const error = normalizeTransportError(new Error('ECONNREFUSED'));
    expect(error).toBeInstanceOf(NetworkError);
    expect(error.message).toBe('ECONNREFUSED');
  });

  it('maps unknown values to TransportError', () => {
    const error = normalizeTransportError('wat');
    expect(error).toBeInstanceOf(TransportError);
    expect(error.message).toBe('Transport request failed');
  });
});

describe('normalizeHttpError', () => {
  it('maps 401 to AuthError', () => {
    expect(normalizeHttpError(401, 'nope')).toBeInstanceOf(AuthError);
  });

  it('maps 403 to AuthorizationError', () => {
    expect(normalizeHttpError(403, 'nope')).toBeInstanceOf(AuthorizationError);
  });

  it('maps 404 to NotFoundError', () => {
    expect(normalizeHttpError(404, 'nope')).toBeInstanceOf(NotFoundError);
  });

  it('maps 409 to ConflictError', () => {
    expect(normalizeHttpError(409, 'nope')).toBeInstanceOf(ConflictError);
  });

  it('keeps other statuses as HttpError', () => {
    const error = normalizeHttpError(500, 'boom');
    expect(error).toBeInstanceOf(HttpError);
    expect(error.exitCode).toBe(EXIT_CODE_TRANSPORT_ERROR);
  });
});

describe('formatUserError', () => {
  it('formats GraphQL errors for stderr', () => {
    const message = formatUserError(
      new GraphQLResponseError([{ message: 'first' }, { message: 'second' }], 'req-9'),
    );

    expect(message).toContain('GraphQL error (request req-9): first; second');
    expect(message.endsWith('\n')).toBe(true);
  });

  it('formats rate limit errors with retry information', () => {
    const message = formatUserError(new RateLimitError(1500, 'slow down'));
    expect(message).toContain('retry after 1500ms');
  });

  it('formats runtime errors with a runtime prefix', () => {
    const message = formatUserError(new Error('kaboom'));
    expect(message).toContain('Runtime error: kaboom');
  });

  it('includes a stack trace in debug mode', () => {
    const error = new Error('kaboom');
    error.stack = 'Error: kaboom\n  at file.ts:1:1';

    const message = formatUserError(error, { debug: true });
    expect(message).toContain('Runtime error: kaboom');
    expect(message).toContain('at file.ts:1:1');
  });
});

describe('stderr writing and exit code lookup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes user-facing errors to stderr only', () => {
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    writeUserError(new AuthError('bad key'));

    expect(stderrSpy).toHaveBeenCalledOnce();
    expect(stdoutSpy).not.toHaveBeenCalled();
  });

  it('returns typed exit codes for UcliError instances', () => {
    expect(getExitCode(new AuthError('bad key'))).toBe(EXIT_CODE_AUTH_FAILURE);
  });

  it('falls back to runtime exit code for unknown errors', () => {
    expect(getExitCode(new Error('boom'))).toBe(EXIT_CODE_RUNTIME_ERROR);
  });
});
