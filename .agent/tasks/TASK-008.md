# TASK-008: Safety Engine (S0-S3 classification + confirmation guards)

## Description
Implement the safety classification system and confirmation guards that protect against accidental destructive operations.

## Acceptance Criteria
- [ ] `src/core/safety/classifier.ts` exports a safety class registry mapping command paths to S0-S3
- [ ] `src/core/safety/confirmation.ts` implements TTY-aware confirmation prompts
- [ ] `src/core/safety/guards.ts` implements pre-execution guards that check safety class against flags
- [ ] S0 (read): execute immediately, never prompt
- [ ] S1 (reversible write): prompt in TTY, skip with --yes, abort in pipe without --yes (exit 10)
- [ ] S2 (critical): always require --yes flag, prompt even in TTY only as reminder
- [ ] S3 (destructive): require both --yes AND --force, extra warning message
- [ ] Missing --yes on S2/S3 produces exit code 10 (confirmation cancelled)
- [ ] TTY detection via `process.stdout.isTTY`

## Affected Files
- `src/core/safety/classifier.ts` (new)
- `src/core/safety/confirmation.ts` (new)
- `src/core/safety/guards.ts` (new)
- `tests/unit/core/safety.test.ts` (new)

## Dependencies
- TASK-001 (GlobalOptions for --yes, --force flags)

## Implementation Notes
- SafetyClass enum: S0, S1, S2, S3
- Registry is a Record<string, SafetyClass> keyed by "domain.action" (e.g., "containers.start")
- Guard function signature: `assertSafety(commandPath: string, flags: { yes?: boolean, force?: boolean }): void`
- Use Node.js readline for TTY prompts

## Validation
- `tests/unit/core/safety.test.ts` covers:
  - S0 commands pass without any flags
  - S1 commands require --yes in non-TTY
  - S2 commands require --yes always
  - S3 commands require both --yes and --force
  - Missing flags produce ConfirmationError with exit code 10
  - TTY detection is used correctly
