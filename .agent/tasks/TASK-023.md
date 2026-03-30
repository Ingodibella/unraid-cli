# TASK-023: Command: schema info|queries|mutations|type|fields|export|diff|validate

## Description
Implement the schema exploration commands. This is the killer feature for power users and AI agents. All S0.

## Acceptance Criteria
- [ ] `ucli schema info` shows schema version, query count, mutation count, type count
- [ ] `ucli schema queries` lists all available top-level queries
- [ ] `ucli schema mutations` lists all available top-level mutations
- [ ] `ucli schema type <name>` shows fields and types for a given type
- [ ] `ucli schema fields <query>` shows the field tree for a query (recursive to depth N)
- [ ] `ucli schema export` exports the full schema as SDL or JSON
- [ ] `ucli schema diff` compares current live schema against saved snapshot
- [ ] `ucli schema validate` checks if known operations are still valid against live schema
- [ ] All support --output (json mode is critical for AI agents)

## Affected Files
- `src/commands/schema/index.ts` (new)
- `src/commands/schema/info.ts` (new)
- `src/commands/schema/queries.ts` (new)
- `src/commands/schema/mutations.ts` (new)
- `src/commands/schema/type.ts` (new)
- `src/commands/schema/fields.ts` (new)
- `src/commands/schema/export.ts` (new)
- `src/commands/schema/diff.ts` (new)
- `src/commands/schema/validate.ts` (new)
- `tests/unit/commands/schema.test.ts` (new)

## Dependencies
- TASK-010 (Introspection tooling)
- TASK-007 (Output layer)

## Implementation Notes
- All commands use introspection under the hood
- diff: compare introspection result against stored snapshot, report added/removed/changed
- validate: check each curated operation against live schema, report broken ones
- fields: tree-walk with depth limit (default 3, configurable with --depth)
- export: SDL format (printSchema from graphql-js) or JSON

## Validation
- `tests/unit/commands/schema.test.ts` covers:
  - info output with mocked introspection
  - queries/mutations listing
  - type inspection
  - field tree with depth limit
  - diff detection (added/removed fields)
  - validate reports broken operations
