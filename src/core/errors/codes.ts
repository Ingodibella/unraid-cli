export const EXIT_CODE_SUCCESS = 0;
export const EXIT_CODE_RUNTIME_ERROR = 1;
export const EXIT_CODE_INVALID_USAGE = 2;
export const EXIT_CODE_AUTH_FAILURE = 3;
export const EXIT_CODE_AUTHORIZATION_FAILURE = 4;
export const EXIT_CODE_NOT_FOUND = 5;
export const EXIT_CODE_CONFLICT = 6;
export const EXIT_CODE_TRANSPORT_ERROR = 7;
export const EXIT_CODE_GRAPHQL_ERROR = 8;
export const EXIT_CODE_PARTIAL_FAILURE = 9;
export const EXIT_CODE_CONFIRMATION_CANCELLED = 10;

export const EXIT_CODES = {
  success: EXIT_CODE_SUCCESS,
  runtimeError: EXIT_CODE_RUNTIME_ERROR,
  invalidUsage: EXIT_CODE_INVALID_USAGE,
  authFailure: EXIT_CODE_AUTH_FAILURE,
  authorizationFailure: EXIT_CODE_AUTHORIZATION_FAILURE,
  notFound: EXIT_CODE_NOT_FOUND,
  conflict: EXIT_CODE_CONFLICT,
  transportError: EXIT_CODE_TRANSPORT_ERROR,
  graphQlError: EXIT_CODE_GRAPHQL_ERROR,
  partialFailure: EXIT_CODE_PARTIAL_FAILURE,
  confirmationCancelled: EXIT_CODE_CONFIRMATION_CANCELLED,
} as const;

export type UcliExitCode = typeof EXIT_CODES[keyof typeof EXIT_CODES];
