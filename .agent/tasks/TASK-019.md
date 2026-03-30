# TASK-019: Write Commands: containers start|stop|restart|pause|unpause|remove

## Description
Implement Docker container write commands with appropriate safety classifications.

## Acceptance Criteria
- [ ] `ucli containers start <name> --yes` starts a container (S1)
- [ ] `ucli containers stop <name> --yes` stops a container (S1)
- [ ] `ucli containers restart <name> --yes` restarts a container (S1)
- [ ] `ucli containers pause <name> --yes` pauses a container (S1)
- [ ] `ucli containers unpause <name> --yes` unpauses a container (S1)
- [ ] `ucli containers remove <name> --yes --force` removes a container (S3)
- [ ] Safety guards enforce correct classification per command
- [ ] TTY prompt for S1 commands in interactive mode
- [ ] S3 remove requires both --yes and --force
- [ ] Success output includes container name and new state
- [ ] Uses nested `docker` mutations from the API

## Affected Files
- `src/commands/containers/start.ts` (new)
- `src/commands/containers/stop.ts` (new)
- `src/commands/containers/restart.ts` (new)
- `src/commands/containers/pause.ts` (new)
- `src/commands/containers/unpause.ts` (new)
- `src/commands/containers/remove.ts` (new)
- `tests/unit/commands/containers-write.test.ts` (new)

## Dependencies
- TASK-014 (Container read commands, shared types)
- TASK-008 (Safety engine)

## Implementation Notes
- DockerMutations: start, stop, pause, unpause, removeContainer
- restart = stop + start (check if API has native restart)
- remove is S3 because it is destructive and irreversible
- After mutation: re-query to confirm state change and display result

## Validation
- `tests/unit/commands/containers-write.test.ts` covers:
  - Each mutation calls correct GraphQL operation
  - Safety guards are checked before execution
  - S1 commands work with --yes
  - S3 remove requires --yes --force
  - Missing flags produce exit code 10
  - Success output shows new state
