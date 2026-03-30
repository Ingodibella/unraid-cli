# Steering

## Grundregeln

- **TypeScript strict mode.** Keine `any` Types ausser in explizit markierten Stellen.
- **ESM only.** Kein CommonJS, keine require() Calls.
- **Keine Em Dashes (--).** In Kommentaren, Docs und Code: Komma, Punkt oder Doppelpunkt statt Em Dash.
- **Schema-first.** Nie Feld-Namen hardcoden die nicht aus dem GraphQL Schema kommen. Immer Codegen-Typen verwenden.
- **Safety Classes beachten.** S0=read (nie prompt), S1=reversible (prompt in TTY), S2=kritisch (--yes), S3=destruktiv (--yes --force).
- **Exit Codes strikt nach Spec.** 0-10, keine eigenen erfinden. Siehe SUMMARY.md.
- **stdout = Daten, stderr = Prosa.** JSON/YAML Output geht auf stdout. Fehlermeldungen, Warnings, Debug-Output auf stderr.
- **Ein Commit pro Task.** Format: `[TASK-XXX] beschreibung`
- **Kein Code ohne Test.** RED-GREEN-REFACTOR. Keine Ausnahmen.

## Aktive Anweisungen

(leer, wird bei Bedarf ergaenzt)

## Gestoppte Tasks

(keine)

## Stil-Korrekturen

(keine)
