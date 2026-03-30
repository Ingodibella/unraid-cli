# TASK-005: HTTP Transport + Retry + Rate Limit Handling

## Description
Implement the HTTP transport layer with retry logic for read operations and rate limit detection with backoff.

## Acceptance Criteria
- [ ] `src/core/transport/http.ts` wraps the HTTP layer used by the GraphQL client
- [ ] `src/core/transport/retry.ts` implements exponential backoff retry for read (S0) operations only
- [ ] Retry is configurable: max retries (default 3), base delay (default 1s)
- [ ] Write operations (S1-S3) are NEVER retried automatically
- [ ] `src/core/transport/rate-limit.ts` detects 429 responses and implements backoff
- [ ] Rate limit backoff respects Retry-After header if present
- [ ] All transport errors are normalized to typed TransportError objects
- [ ] Timeout errors are distinct from network errors

## Affected Files
- `src/core/transport/http.ts` (new)
- `src/core/transport/retry.ts` (new)
- `src/core/transport/rate-limit.ts` (new)
- `tests/unit/core/transport.test.ts` (new)

## Dependencies
- TASK-004 (GraphQL client uses transport)

## Implementation Notes
- Retry only on: network errors, 5xx status codes, timeouts
- Never retry on: 4xx (except 429), GraphQL errors
- Rate limit: Unraid API uses 100 req/10s (nestjs/throttler)
- Exponential backoff: delay * 2^attempt with jitter

## Validation
- `tests/unit/core/transport.test.ts` covers:
  - Successful request pass-through
  - Retry on 500 (up to max retries)
  - No retry on 400/401/403
  - Retry on timeout
  - Rate limit detection on 429
  - Backoff delay calculation
  - Write operations bypass retry
