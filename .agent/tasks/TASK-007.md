# TASK-007: Output Layer (human, json, yaml, table renderers)

## Description
Implement the output rendering layer with four format modes. All data goes to stdout, all diagnostics/errors to stderr.

## Acceptance Criteria
- [ ] `src/core/output/renderer.ts` defines the OutputRenderer interface and dispatch function
- [ ] `src/core/output/human.ts` renders colored, compact key:value output using Chalk
- [ ] `src/core/output/json.ts` renders stable JSON with 2-space indent to stdout
- [ ] `src/core/output/yaml.ts` renders YAML to stdout
- [ ] `src/core/output/table.ts` renders tabular output using cli-table3
- [ ] `src/core/output/fields.ts` implements --fields selection (pick only specified keys)
- [ ] Output format dispatch: --output flag > TTY detection (human for TTY, json for pipe)
- [ ] --no-color disables Chalk colors
- [ ] --quiet suppresses non-essential output
- [ ] No prose/status messages on stdout in json/yaml mode

## Affected Files
- `src/core/output/renderer.ts` (new)
- `src/core/output/human.ts` (new)
- `src/core/output/json.ts` (new)
- `src/core/output/yaml.ts` (new)
- `src/core/output/table.ts` (new)
- `src/core/output/fields.ts` (new)
- `tests/unit/core/output.test.ts` (new)

## Dependencies
- TASK-001 (GlobalOptions for output format, fields, no-color, quiet)

## Implementation Notes
- Human renderer: status indicators (green/red/yellow), human-friendly sizes (GB/TB), temperatures with units
- JSON renderer: JSON.stringify(data, null, 2), stable key ordering
- Table renderer: auto-width columns, cli-table3
- Field selection: dot-notation support for nested fields (e.g., --fields name,status,disks.size)

## Validation
- `tests/unit/core/output.test.ts` covers:
  - Human format renders key:value pairs
  - JSON format produces valid JSON
  - YAML format produces valid YAML
  - Table format renders columns
  - Field selection filters output
  - No-color mode strips ANSI
  - Quiet mode suppresses extras
