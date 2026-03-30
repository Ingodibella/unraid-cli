# TASK-014: Command: containers list|get|status|inspect|logs|stats

## Description
Implement Docker container read commands. All S0. The `docker` top-level query is the entry point (not `dockerContainers` which does not exist).

## Acceptance Criteria
- [ ] `ucli containers list` shows all containers with name, image, status, ports, uptime
- [ ] `ucli containers get <name>` shows detailed container info
- [ ] `ucli containers status` shows running/stopped/paused counts and per-container status
- [ ] `ucli containers inspect <name>` shows full container details (raw data dump)
- [ ] `ucli containers logs <name>` shows container logs (if available via API)
- [ ] `ucli containers stats` shows resource usage per container (CPU, memory)
- [ ] List supports --filter (e.g., --filter "status=running"), --sort, --page
- [ ] All support --output and --fields

## Affected Files
- `src/commands/containers/index.ts` (new)
- `src/commands/containers/list.ts` (new)
- `src/commands/containers/get.ts` (new)
- `src/commands/containers/status.ts` (new)
- `src/commands/containers/inspect.ts` (new)
- `src/commands/containers/logs.ts` (new)
- `src/commands/containers/stats.ts` (new)
- `tests/unit/commands/containers.test.ts` (new)
- `tests/fixtures/docker-response.json` (new)

## Dependencies
- TASK-004 (GraphQL client)
- TASK-007 (Output layer)
- TASK-009 (Filter/sort/page)

## Implementation Notes
- Uses `docker` top-level query (NOT `dockerContainers`)
- Schema exploration needed: exact field structure under `docker` query
- Container names may need normalization (strip leading /)
- Logs: check if API exposes container logs or if this needs a different approach

## Validation
- `tests/unit/commands/containers.test.ts` covers:
  - List with mocked docker response
  - Get by name
  - Filter by status
  - Inspect outputs full data
  - All output modes
