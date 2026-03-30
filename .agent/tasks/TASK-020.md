# TASK-020: Write Commands: vms start|stop|pause|resume|reboot|reset|force-stop

## Description
Implement VM write commands with appropriate safety classifications.

## Acceptance Criteria
- [ ] `ucli vms start <name> --yes` starts a VM (S1)
- [ ] `ucli vms stop <name> --yes` gracefully stops a VM (S1)
- [ ] `ucli vms pause <name> --yes` pauses a VM (S1)
- [ ] `ucli vms resume <name> --yes` resumes a paused VM (S1)
- [ ] `ucli vms reboot <name> --yes` reboots a VM (S2)
- [ ] `ucli vms reset <name> --yes --force` hard-resets a VM (S3)
- [ ] `ucli vms force-stop <name> --yes --force` force-kills a VM (S3)
- [ ] Safety guards enforce correct classification
- [ ] Success output includes VM name and new state

## Affected Files
- `src/commands/vms/start.ts` (new)
- `src/commands/vms/stop.ts` (new)
- `src/commands/vms/pause.ts` (new)
- `src/commands/vms/resume.ts` (new)
- `src/commands/vms/reboot.ts` (new)
- `src/commands/vms/reset.ts` (new)
- `src/commands/vms/force-stop.ts` (new)
- `tests/unit/commands/vms-write.test.ts` (new)

## Dependencies
- TASK-015 (VM read commands, shared types)
- TASK-008 (Safety engine)

## Implementation Notes
- VmMutations: start, stop, pause, resume, reboot, reset, forceStop
- reboot is S2 (can cause data loss if VM is not shut down cleanly)
- reset and force-stop are S3 (equivalent to pulling the power plug)
- After mutation: re-query to confirm state change

## Validation
- `tests/unit/commands/vms-write.test.ts` covers:
  - Each mutation calls correct GraphQL operation
  - S1/S2/S3 safety classifications are correct
  - Missing flags produce exit code 10
  - Success output shows new state
