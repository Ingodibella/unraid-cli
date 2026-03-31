# Schema-Migration Status (2026-03-31 15:15)

## Ausgangslage
Alle `src/generated/*.ts` und `src/commands/*/` wurden gegen das echte Schema (`schema/unraid.graphql`) migriert.
TypeScript typecheck: **GRÜN** (0 Errors)

## Test-Status: 351/384 passing (33 failures)

### Grüne Gruppen (Tests bestehen)
- system (7 tests) ✅
- array + array-write (17 tests) ✅
- containers + containers-write (17 tests) ✅
- vms + vms-write (17 tests) ✅
- disks + disks-write (11 tests) ✅
- diagnostics (8 tests) ✅
- services (4 tests) ✅ (Fixture wurde angepasst)
- network (4 tests) ✅
- schema (7 tests) ✅

### Rote Gruppen (Tests fehlschlagen)

#### Golden Tests (14 failures)
- `tests/contract/golden.test.ts` - Alle 14 Golden Fixtures sind veraltet
- **Fix:** Golden Fixtures (`tests/fixtures/golden/`) regenerieren oder updaten mit `npx vitest run tests/contract/golden.test.ts --update`

#### Logs (5 failures)
- `tests/unit/commands/logs.test.ts` - Fixture/Assertions nicht angepasst
- **Fix:** `tests/fixtures/logs-response.json` und Test-Assertions an neue Typen anpassen (logFiles/logFile statt logs)

#### Notifications (5 failures + 3 write failures)
- `tests/unit/commands/notifications.test.ts` - Fixture/Assertions nicht angepasst
- `tests/unit/commands/notifications-write.test.ts` - Mutations-Assertions nicht angepasst
- **Fix:** Fixture und Tests an neue Notification-Struktur anpassen (list mit filter, overview mit counts)

#### Shares (2 failures)
- `tests/unit/commands/shares.test.ts` - Fixture fields nicht angepasst
- **Fix:** `tests/fixtures/shares-response.json` und Assertions an neue Share-Felder anpassen (kein type/allocation)

## Live-Test Credentials
```bash
export UCLI_HOST=http://192.168.1.100:7777
export UCLI_API_KEY=YOUR_API_KEY
```

## Nächste Schritte
1. Rote Tests fixen (logs, notifications, shares, golden)
2. `npm test` komplett grün
3. Live-Smoke-Tests durchführen
4. Committen: `[SCHEMA-MIGRATION] Fix all commands, tests and fixtures for real Unraid API`
