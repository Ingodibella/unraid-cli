# TASK-013: Command: disks list|get|status|smart|usage|temp

## Description
Implement the `disks` read commands for individual disk information, SMART data, and temperature monitoring. All S0.

## Acceptance Criteria
- [ ] `ucli disks list` shows all disks with name, size, status, temp, type (parity/data/cache/flash)
- [ ] `ucli disks get <name>` shows detailed info for a single disk
- [ ] `ucli disks status` shows health status overview of all disks
- [ ] `ucli disks smart <name>` shows SMART attributes for a disk
- [ ] `ucli disks usage` shows storage utilization per disk
- [ ] `ucli disks temp` shows temperature for all disks (with optional threshold warnings)
- [ ] `ucli disks assignable list` shows disks available for assignment
- [ ] List commands support --filter, --sort, --page
- [ ] All support --output and --fields

## Affected Files
- `src/commands/disks/index.ts` (new)
- `src/commands/disks/list.ts` (new)
- `src/commands/disks/get.ts` (new)
- `src/commands/disks/status.ts` (new)
- `src/commands/disks/smart.ts` (new)
- `src/commands/disks/usage.ts` (new)
- `src/commands/disks/temp.ts` (new)
- `src/commands/disks/assignable.ts` (new)
- `tests/unit/commands/disks.test.ts` (new)
- `tests/fixtures/disks-response.json` (new)

## Dependencies
- TASK-004 (GraphQL client)
- TASK-007 (Output layer)
- TASK-009 (Filter/sort/page)

## Implementation Notes
- Uses `disks`, `disk(name)`, and `assignableDisks` queries
- Temp display: color-coded (green <40C, yellow 40-50C, red >50C)
- Human sizes: auto-convert bytes to GB/TB
- SMART data: key attributes table (if available in API)

## Validation
- `tests/unit/commands/disks.test.ts` covers:
  - List with mocked response
  - Get single disk by name
  - Temperature color coding
  - Filter and sort on list
  - Assignable list
  - All output modes
