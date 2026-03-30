# TASK-021: Write Commands: array start|stop + parity check start|pause|resume|cancel

## Description
Implement array and parity check write commands. Array operations are critical system changes.

## Acceptance Criteria
- [ ] `ucli array start --yes` starts the array (S2)
- [ ] `ucli array stop --yes` stops the array (S2)
- [ ] `ucli array parity check start --yes` starts a parity check (S1)
- [ ] `ucli array parity check pause --yes` pauses a running parity check (S1)
- [ ] `ucli array parity check resume --yes` resumes a paused parity check (S1)
- [ ] `ucli array parity check cancel --yes` cancels a running parity check (S2)
- [ ] Array start/stop are S2 (critical system change)
- [ ] Parity cancel is S2 (interrupts important operation)
- [ ] Safety guards enforce classifications
- [ ] Output confirms state change

## Affected Files
- `src/commands/array/start.ts` (new)
- `src/commands/array/stop.ts` (new)
- `src/commands/array/parity-check.ts` (new, sub-group for parity check mutations)
- `tests/unit/commands/array-write.test.ts` (new)

## Dependencies
- TASK-012 (Array read commands)
- TASK-008 (Safety engine)

## Implementation Notes
- ArrayMutations: setState (start/stop)
- ParityCheckMutations: start, pause, resume, cancel
- Array stop while containers/VMs running: warn user but allow with --yes
- Parity check cancel: warn about incomplete check

## Validation
- `tests/unit/commands/array-write.test.ts` covers:
  - Array start/stop mutations
  - Parity check lifecycle (start, pause, resume, cancel)
  - S2 commands require --yes
  - Safety guard enforcement
  - Output confirms new state
