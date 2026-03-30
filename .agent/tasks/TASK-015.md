# TASK-015: Command: vms list|get|status|inspect

## Description
Implement VM read commands. All S0.

## Acceptance Criteria
- [ ] `ucli vms list` shows all VMs with name, status, vCPUs, memory, disk size
- [ ] `ucli vms get <name>` shows detailed VM info
- [ ] `ucli vms status` shows running/stopped counts and per-VM status
- [ ] `ucli vms inspect <name>` shows full VM details (raw data dump)
- [ ] List supports --filter (e.g., --filter "status=running"), --sort, --page
- [ ] All support --output and --fields

## Affected Files
- `src/commands/vms/index.ts` (new)
- `src/commands/vms/list.ts` (new)
- `src/commands/vms/get.ts` (new)
- `src/commands/vms/status.ts` (new)
- `src/commands/vms/inspect.ts` (new)
- `tests/unit/commands/vms.test.ts` (new)
- `tests/fixtures/vms-response.json` (new)

## Dependencies
- TASK-004 (GraphQL client)
- TASK-007 (Output layer)
- TASK-009 (Filter/sort/page)

## Implementation Notes
- Uses `vms` top-level query
- Schema exploration needed: exact field structure under `vms`
- VM names are the primary identifier

## Validation
- `tests/unit/commands/vms.test.ts` covers:
  - List with mocked response
  - Get by name
  - Filter by status
  - Inspect outputs full data
  - All output modes
