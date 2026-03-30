# TASK-017: Command: shares list|get|usage

## Description
Implement share read commands. All S0.

## Acceptance Criteria
- [ ] `ucli shares list` shows all shares with name, type, size, used, free, allocation
- [ ] `ucli shares get <name>` shows detailed share information
- [ ] `ucli shares usage` shows storage utilization across all shares
- [ ] List supports --filter, --sort, --page
- [ ] All support --output and --fields

## Affected Files
- `src/commands/shares/index.ts` (new)
- `src/commands/shares/list.ts` (new)
- `src/commands/shares/get.ts` (new)
- `src/commands/shares/usage.ts` (new)
- `tests/unit/commands/shares.test.ts` (new)
- `tests/fixtures/shares-response.json` (new)

## Dependencies
- TASK-004 (GraphQL client)
- TASK-007 (Output layer)

## Implementation Notes
- Uses `shares` top-level query
- Human format: usage bars or percentages
- Share types: user shares, disk shares, cache

## Validation
- `tests/unit/commands/shares.test.ts` covers:
  - List with mocked response
  - Get by name
  - Usage display
  - Filter and sort
  - All output modes
