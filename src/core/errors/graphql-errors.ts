import { EXIT_CODE_AUTH_FAILURE, EXIT_CODE_AUTHORIZATION_FAILURE, EXIT_CODE_CONFLICT, EXIT_CODE_GRAPHQL_ERROR, EXIT_CODE_NOT_FOUND, type UcliExitCode } from './codes.js';

export interface GraphQLErrorLocation {
  line: number;
  column: number;
}

export interface GraphQLErrorDetail {
  message: string;
  locations?: GraphQLErrorLocation[];
  path?: string[];
  extensions?: Record<string, unknown>;
}

export class UcliError extends Error {
  readonly exitCode: UcliExitCode;
  readonly details?: unknown;

  constructor(message: string, exitCode: UcliExitCode, details?: unknown) {
    super(message);
    this.name = 'UcliError';
    this.exitCode = exitCode;
    this.details = details;
  }
}

export class InvalidUsageError extends UcliError {
  constructor(message: string, details?: unknown) {
    super(message, 2, details);
    this.name = 'InvalidUsageError';
  }
}

export class AuthError extends UcliError {
  constructor(message: string, details?: unknown) {
    super(message, EXIT_CODE_AUTH_FAILURE, details);
    this.name = 'AuthError';
  }
}

export class AuthorizationError extends UcliError {
  constructor(message: string, details?: unknown) {
    super(message, EXIT_CODE_AUTHORIZATION_FAILURE, details);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends UcliError {
  constructor(message: string, details?: unknown) {
    super(message, EXIT_CODE_NOT_FOUND, details);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends UcliError {
  constructor(message: string, details?: unknown) {
    super(message, EXIT_CODE_CONFLICT, details);
    this.name = 'ConflictError';
  }
}

export class PartialFailureError extends UcliError {
  constructor(message: string, details?: unknown) {
    super(message, 9, details);
    this.name = 'PartialFailureError';
  }
}

export class ConfirmationCancelledError extends UcliError {
  constructor(message = 'Confirmation cancelled', details?: unknown) {
    super(message, 10, details);
    this.name = 'ConfirmationCancelledError';
  }
}

export class GraphQLResponseError extends UcliError {
  readonly errors: GraphQLErrorDetail[];
  readonly requestId?: string;

  constructor(errors: GraphQLErrorDetail[], requestId?: string) {
    const messages = errors.map((error) => error.message).join('; ');
    super(`GraphQL error: ${messages}`, EXIT_CODE_GRAPHQL_ERROR, { errors, requestId });
    this.name = 'GraphQLResponseError';
    this.errors = errors;
    this.requestId = requestId;
  }
}

export interface GraphQLLikeError {
  message: string;
  locations?: unknown;
  path?: unknown;
  extensions?: unknown;
}

export interface GraphQLErrorResponseLike {
  errors?: GraphQLLikeError[];
  status?: number;
}

export function normalizeGraphQLErrors(
  response: GraphQLErrorResponseLike,
  requestId?: string,
): UcliError {
  const errors = (response.errors ?? []).map(normalizeGraphQLErrorDetail);

  if (response.status === 401) {
    return new AuthError(firstMessage(errors, 'Authentication failed'), { errors, requestId });
  }

  if (response.status === 403 || hasExtensionCode(errors, 'FORBIDDEN')) {
    return new AuthorizationError(firstMessage(errors, 'Authorization failed'), { errors, requestId });
  }

  if (response.status === 404 || hasExtensionCode(errors, 'NOT_FOUND')) {
    return new NotFoundError(firstMessage(errors, 'Resource not found'), { errors, requestId });
  }

  if (response.status === 409 || hasExtensionCode(errors, 'CONFLICT')) {
    return new ConflictError(firstMessage(errors, 'Conflict'), { errors, requestId });
  }

  return new GraphQLResponseError(errors, requestId);
}

function normalizeGraphQLErrorDetail(error: GraphQLLikeError): GraphQLErrorDetail {
  return {
    message: error.message,
    locations: Array.isArray(error.locations)
      ? (error.locations as GraphQLErrorLocation[])
      : undefined,
    path: Array.isArray(error.path) ? (error.path as string[]) : undefined,
    extensions: isRecord(error.extensions)
      ? (error.extensions as Record<string, unknown>)
      : undefined,
  };
}

function hasExtensionCode(errors: GraphQLErrorDetail[], code: string): boolean {
  return errors.some((error) => error.extensions?.['code'] === code);
}

function firstMessage(errors: GraphQLErrorDetail[], fallback: string): string {
  return errors[0]?.message ?? fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isUcliError(error: unknown): error is UcliError {
  return error instanceof UcliError;
}
