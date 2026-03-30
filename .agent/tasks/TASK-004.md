# TASK-004: GraphQL Client Core

## Description
Build the core GraphQL client that all commands use. Handles endpoint resolution, auth header injection, timeouts, and request execution.

## Acceptance Criteria
- [ ] `src/core/graphql/client.ts` exports a `createClient(config)` factory
- [ ] Client accepts endpoint URL and API key from resolved config
- [ ] `x-api-key` header is automatically injected on every request
- [ ] Configurable timeout (default 30s)
- [ ] Request ID (UUID) added to each request for debug correlation
- [ ] Debug mode logs full request/response to stderr
- [ ] `client.execute<T>(document, variables?)` returns typed response
- [ ] GraphQL errors in response are detected and thrown as typed errors

## Affected Files
- `src/core/graphql/client.ts` (new)
- `src/core/graphql/operations.ts` (new, initially empty registry)
- `tests/unit/core/graphql-client.test.ts` (new)

## Dependencies
- TASK-003 (Auth resolver provides host + apiKey)

## Implementation Notes
- Use `graphql-request` as the underlying HTTP client
- The client is created per CLI invocation (not a singleton)
- Operations registry will grow as commands are added
- Consider a `GraphQLClientOptions` interface:
  ```typescript
  interface GraphQLClientOptions {
    endpoint: string;
    apiKey: string;
    timeout?: number;
    debug?: boolean;
    requestId?: string;
  }
  ```

## Validation
- `tests/unit/core/graphql-client.test.ts` covers:
  - Client creation with valid options
  - Auth header injection (mock HTTP to verify header)
  - Timeout configuration
  - Request ID generation
  - GraphQL error detection and typed error throw
  - Debug mode output to stderr
