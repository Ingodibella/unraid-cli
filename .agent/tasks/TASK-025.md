# TASK-025: Command: logs + services + network

## Description
Implement the remaining read command groups: logs, services, and network. All S0.

## Acceptance Criteria
- [ ] `ucli logs list` shows available log files
- [ ] `ucli logs get <name>` shows contents of a log file
- [ ] `ucli logs tail <name>` shows the last N lines of a log (default 50)
- [ ] `ucli logs system` shows the system/syslog
- [ ] `ucli logs search --query <term>` searches across logs
- [ ] `ucli services list` shows all services with name and status
- [ ] `ucli services get <name>` shows detailed service info
- [ ] `ucli services status` shows service health overview
- [ ] `ucli network status` shows network overview
- [ ] `ucli network interfaces list` shows network interfaces
- [ ] `ucli network interfaces get <name>` shows interface details
- [ ] All support --output and --fields

## Affected Files
- `src/commands/logs/index.ts` (new)
- `src/commands/logs/list.ts` (new)
- `src/commands/logs/get.ts` (new)
- `src/commands/logs/tail.ts` (new)
- `src/commands/logs/system.ts` (new)
- `src/commands/logs/search.ts` (new)
- `src/commands/services/index.ts` (new)
- `src/commands/services/list.ts` (new)
- `src/commands/services/get.ts` (new)
- `src/commands/services/status.ts` (new)
- `src/commands/network/index.ts` (new)
- `src/commands/network/status.ts` (new)
- `src/commands/network/interfaces.ts` (new)
- `tests/unit/commands/logs.test.ts` (new)
- `tests/unit/commands/services.test.ts` (new)
- `tests/unit/commands/network.test.ts` (new)

## Dependencies
- TASK-004 (GraphQL client)
- TASK-007 (Output layer)
- TASK-009 (Filter/sort/page)

## Implementation Notes
- Uses `logFiles`, `logFile(name)`, `services`, `network` top-level queries
- Logs tail: fetch log content, return last N lines
- Logs search: fetch multiple log files, grep for term
- Services: check if API exposes service status or if this is derived

## Validation
- `tests/unit/commands/logs.test.ts` covers: list, get, tail, search
- `tests/unit/commands/services.test.ts` covers: list, get, status
- `tests/unit/commands/network.test.ts` covers: status, interfaces list/get
