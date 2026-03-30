# TASK-016: Command: notifications list|get|latest|watch

## Description
Implement notification read commands. All S0.

## Acceptance Criteria
- [ ] `ucli notifications list` shows all notifications with title, message, severity, timestamp, read/unread
- [ ] `ucli notifications get <id>` shows a single notification in detail
- [ ] `ucli notifications latest` shows the N most recent notifications (default: 10)
- [ ] `ucli notifications watch` polls for new notifications and streams them to stdout
- [ ] Watch mode: configurable interval (default 10s), respects rate limits
- [ ] List supports --filter (e.g., --filter "severity=alert"), --sort, --page
- [ ] All support --output and --fields

## Affected Files
- `src/commands/notifications/index.ts` (new)
- `src/commands/notifications/list.ts` (new)
- `src/commands/notifications/get.ts` (new)
- `src/commands/notifications/latest.ts` (new)
- `src/commands/notifications/watch.ts` (new)
- `tests/unit/commands/notifications.test.ts` (new)
- `tests/fixtures/notifications-response.json` (new)

## Dependencies
- TASK-004 (GraphQL client)
- TASK-007 (Output layer)
- TASK-009 (Filter/sort/page)

## Implementation Notes
- Uses `notifications` top-level query
- Watch mode: setInterval with query, print new notifications since last check
- Watch respects Ctrl+C for clean exit
- Severity levels affect color in human mode

## Validation
- `tests/unit/commands/notifications.test.ts` covers:
  - List with mocked response
  - Get by ID
  - Latest returns N items
  - Watch mode setup (mock timer)
  - Filter by severity
  - All output modes
