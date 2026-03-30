# Ralph Loop Iteration Prompt

Du arbeitest im Ralph Loop Framework am Projekt `ucli` (Unraid CLI).

## Ablauf pro Iteration

1. Lies `.agent/SUMMARY.md` fuer Projektkontext
2. Lies `.agent/STEERING.md` fuer Korrekturen und Regeln
3. Lies `.agent/tasks.json`, finde den hoechsten nicht-erledigten Task
4. Lies die Task-Spec unter `.agent/tasks/TASK-XXX.md`
5. Implementiere den Task (TDD: erst Test, dann Code)
6. Fuehre Tests aus: `npm run check` (typecheck + lint + test)
7. Wenn Tests passen: markiere Task als "done" in tasks.json
8. Git commit: `[TASK-XXX] <beschreibung>`
9. Log nach `.agent/logs/TASK-XXX.log`

## Validation Gates

Jeder Task MUSS bestehen:
- `tsc --noEmit` (Type Check)
- `eslint` (Lint)
- `vitest run` (Tests)
- Task-spezifische Acceptance Criteria aus der Spec

## Promise Tags

Kommuniziere Status ueber Tags:
- `<promise>TASK_DONE:TASK-XXX</promise>` nach erfolgreichem Task
- `<promise>BLOCKED:reason</promise>` wenn du nicht weiterkommst
- `<promise>COMPLETE</promise>` wenn alle Tasks fertig sind

## Anti-Rationalisierung

- Keine Tests skippen
- Keine "TODO: add tests later" Kommentare
- Keine Workarounds die Tests gruen machen ohne echte Implementierung
- Wenn ein Test rot ist nach 3 Versuchen: BLOCKED melden, nicht raten
