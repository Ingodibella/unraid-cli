# TASK-011: Command: system info|status|health|uptime|resources

## Description
Implement the `system` command group with read-only subcommands for system information. All S0 (no confirmation needed).

## Acceptance Criteria
- [ ] `ucli system info` shows OS platform, distro, release, hostname, uptime
- [ ] `ucli system status` shows array state, docker status, VM status, key metrics
- [ ] `ucli system health` shows health indicators (temps, disk status, parity status)
- [ ] `ucli system uptime` shows uptime in human-readable format
- [ ] `ucli system resources` shows CPU, memory, and storage utilization
- [ ] All subcommands support --output (human, json, yaml, table)
- [ ] All subcommands support --fields for selective output
- [ ] GraphQL queries use generated types, not hardcoded field names
- [ ] Errors produce correct exit codes

## Affected Files
- `src/commands/system/index.ts` (new)
- `src/commands/system/info.ts` (new)
- `src/commands/system/status.ts` (new)
- `src/commands/system/health.ts` (new)
- `src/commands/system/uptime.ts` (new)
- `src/commands/system/resources.ts` (new)
- `tests/unit/commands/system.test.ts` (new)
- `tests/fixtures/system-info.json` (new, mock response)

## Dependencies
- TASK-004 (GraphQL client)
- TASK-007 (Output layer)
- TASK-006 (Error handling)

## Implementation Notes
- Uses `info` and `server` top-level queries
- Human format: compact key:value with color-coded status
- Uptime: convert seconds to "X days, Y hours, Z minutes"
- Resources: percentage bars or simple percentages

## Validation
- `tests/unit/commands/system.test.ts` covers:
  - info subcommand with mocked GraphQL response
  - status subcommand output format
  - All output modes (human, json, yaml, table)
  - Field selection works
  - Error handling for failed queries
