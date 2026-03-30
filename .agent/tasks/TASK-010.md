# TASK-010: Schema Snapshot + Introspection Tooling

## Description
Build the schema introspection utilities that power the `schema` commands and capability detection. Support fetching the live schema and storing snapshots locally.

## Acceptance Criteria
- [ ] `src/core/graphql/introspection.ts` can fetch the full schema via introspection query
- [ ] Schema can be saved as a local snapshot file (JSON or SDL)
- [ ] Snapshot loading for offline type generation
- [ ] `src/core/capabilities/schema-version.ts` extracts API version info from schema or info query
- [ ] `src/core/capabilities/detector.ts` checks available queries/mutations against expected operations
- [ ] Capability detection identifies which commands the connected server supports

## Affected Files
- `src/core/graphql/introspection.ts` (new)
- `src/core/capabilities/detector.ts` (new)
- `src/core/capabilities/schema-version.ts` (new)
- `tests/unit/core/introspection.test.ts` (new)

## Dependencies
- TASK-004 (GraphQL client for executing introspection query)

## Implementation Notes
- Standard introspection query: `{ __schema { types { name fields { name type { name } } } queryType { fields { name } } mutationType { fields { name } } } }`
- Snapshot format: full introspection result as JSON
- Store snapshots under a configurable path (default: project root or XDG data)
- Capability detector returns: `{ availableQueries: string[], availableMutations: string[], apiVersion?: string }`

## Validation
- `tests/unit/core/introspection.test.ts` covers:
  - Introspection query execution (mocked)
  - Schema snapshot save/load
  - Capability detection from schema
  - Missing query/mutation detection
