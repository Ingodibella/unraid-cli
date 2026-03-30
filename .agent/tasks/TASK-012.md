# TASK-012: Command: array show|status|devices + parity status|history

## Description
Implement the `array` read commands showing array state, disk composition, and parity information. All S0.

## Acceptance Criteria
- [ ] `ucli array show` displays full array overview (state, capacity, usage, disk count)
- [ ] `ucli array status` shows array state (Started/Stopped) with color indicator
- [ ] `ucli array devices` lists all array disks with name, size, status, temp, filesystem
- [ ] `ucli array parity status` shows parity check status (running/idle, progress, speed, errors)
- [ ] `ucli array parity history` shows past parity check results (date, duration, errors, speed)
- [ ] All subcommands support --output and --fields
- [ ] Devices subcommand supports --filter and --sort
- [ ] Uses `array` top-level query from GraphQL schema

## Affected Files
- `src/commands/array/index.ts` (new)
- `src/commands/array/show.ts` (new)
- `src/commands/array/status.ts` (new)
- `src/commands/array/devices.ts` (new)
- `src/commands/array/parity.ts` (new)
- `tests/unit/commands/array.test.ts` (new)
- `tests/fixtures/array-response.json` (new)

## Dependencies
- TASK-004 (GraphQL client)
- TASK-007 (Output layer)
- TASK-006 (Error handling)

## Implementation Notes
- `array` query returns state, disks array, capacity info
- `parityHistory` is a separate top-level query
- Human format: status with colored dot, sizes in human units (TB/GB)
- Table format for devices: Name | Size | Status | Temp | FS

## Validation
- `tests/unit/commands/array.test.ts` covers:
  - show with mocked array response
  - status color coding
  - devices list with filter/sort
  - parity status display
  - parity history display
  - All output modes
