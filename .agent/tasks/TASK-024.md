# TASK-024: Command: diagnostics doctor|ping|latency|permissions|env|graphql

## Description
Implement diagnostic commands for troubleshooting connectivity, auth, and API issues.

## Acceptance Criteria
- [ ] `ucli diagnostics doctor` runs full health check: config, auth, connectivity, schema, permissions
- [ ] `ucli diagnostics ping` checks if the GraphQL endpoint responds (exit 0 or 7)
- [ ] `ucli diagnostics latency` measures round-trip time to the endpoint (multiple samples)
- [ ] `ucli diagnostics permissions` shows what the current API key can do (roles, resources, actions)
- [ ] `ucli diagnostics env` shows resolved configuration (host, profile, config path, env vars) without secrets
- [ ] `ucli diagnostics graphql --query <file>` executes a raw GraphQL query from a file
- [ ] Doctor output: checklist with pass/fail for each check
- [ ] All support --output

## Affected Files
- `src/commands/diagnostics/index.ts` (new)
- `src/commands/diagnostics/doctor.ts` (new)
- `src/commands/diagnostics/ping.ts` (new)
- `src/commands/diagnostics/latency.ts` (new)
- `src/commands/diagnostics/permissions.ts` (new)
- `src/commands/diagnostics/env.ts` (new)
- `src/commands/diagnostics/graphql.ts` (new)
- `tests/unit/commands/diagnostics.test.ts` (new)

## Dependencies
- TASK-004 (GraphQL client)
- TASK-003 (Auth resolver)
- TASK-010 (Introspection)

## Implementation Notes
- Doctor checks in order: config exists, credentials exist, endpoint reachable, auth valid, schema fetchable, key permissions
- ping: simple `info { os { platform } }` query, measure time
- latency: 5 samples, report min/max/avg/p95
- permissions: use `me` or `getPermissionsForRoles` query
- env: resolve config without executing, display all resolved values (mask API key)
- graphql: read file, execute as-is, render response

## Validation
- `tests/unit/commands/diagnostics.test.ts` covers:
  - Doctor check sequence (mocked)
  - Ping success and failure
  - Latency calculation
  - Permissions display
  - Env output (verify API key is masked)
  - Raw GraphQL execution
