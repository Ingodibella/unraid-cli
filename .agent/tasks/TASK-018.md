# TASK-018: Golden Test Fixtures for Read Commands

## Description
Create golden test fixtures (snapshot tests) for all read command outputs. These lock down the human-readable output format and catch unintended regressions.

## Acceptance Criteria
- [ ] Golden fixture files exist for each read command's human output
- [ ] `tests/contract/golden.test.ts` compares rendered output against golden files
- [ ] Fixtures cover: system info, array show, disks list, containers list, vms list, notifications list, shares list
- [ ] Each fixture has a mock GraphQL response and expected rendered output
- [ ] Tests fail if output format changes (intentional changes require fixture update)
- [ ] JSON output fixtures validate schema stability

## Affected Files
- `tests/contract/golden.test.ts` (new)
- `tests/fixtures/golden/system-info.human.txt` (new)
- `tests/fixtures/golden/array-show.human.txt` (new)
- `tests/fixtures/golden/disks-list.human.txt` (new)
- `tests/fixtures/golden/containers-list.human.txt` (new)
- `tests/fixtures/golden/vms-list.human.txt` (new)
- `tests/fixtures/golden/notifications-list.human.txt` (new)
- `tests/fixtures/golden/shares-list.human.txt` (new)

## Dependencies
- TASK-011 through TASK-017 (all read commands must exist)

## Implementation Notes
- Use Vitest snapshot testing or manual file comparison
- Golden files are committed to git
- A helper script to regenerate fixtures when format intentionally changes
- Consider: `vitest --update` for snapshot updates

## Validation
- `tests/contract/golden.test.ts` passes with all fixtures matching
- Changing a renderer intentionally requires updating the golden file
