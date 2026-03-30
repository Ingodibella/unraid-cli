# TASK-006: Error Handling + Exit Code Mapping

## Description
Implement the error handling system with typed errors and correct exit code mapping per the spec.

## Acceptance Criteria
- [ ] `src/core/errors/codes.ts` exports all exit code constants (0-10)
- [ ] `src/core/errors/graphql-errors.ts` normalizes GraphQL error responses to typed errors
- [ ] `src/core/errors/transport-errors.ts` normalizes HTTP/network errors
- [ ] `src/core/errors/user-errors.ts` formats user-facing error messages for stderr
- [ ] Each error type maps to a specific exit code:
  - Runtime error -> 1
  - Invalid usage -> 2
  - Auth failure (no credentials, bad key) -> 3
  - Authorization failure (forbidden) -> 4
  - Not found -> 5
  - Conflict -> 6
  - Transport error (network, timeout) -> 7
  - GraphQL error -> 8
  - Partial failure -> 9
  - Confirmation cancelled -> 10
- [ ] `process.exit(code)` is called only at the top-level error boundary, not in business logic
- [ ] Error messages are written to stderr, never stdout

## Affected Files
- `src/core/errors/codes.ts` (new)
- `src/core/errors/graphql-errors.ts` (new)
- `src/core/errors/transport-errors.ts` (new)
- `src/core/errors/user-errors.ts` (new)
- `tests/unit/core/errors.test.ts` (new)

## Dependencies
- TASK-004 (GraphQL client throws errors that need normalization)

## Implementation Notes
- Use custom Error subclasses: `UcliError`, `AuthError`, `TransportError`, `GraphQLResponseError`
- Each has an `exitCode` property
- Top-level catch in cli/index.ts maps error to exit code
- In --debug mode, full stack trace to stderr

## Validation
- `tests/unit/core/errors.test.ts` covers:
  - Each error type has correct exit code
  - GraphQL error normalization
  - Transport error normalization
  - User-facing message formatting
  - Debug mode includes stack trace
