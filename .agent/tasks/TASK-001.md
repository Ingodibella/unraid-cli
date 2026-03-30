# TASK-001: CLI Framework Setup + Global Flags

## Description
Set up the Commander.js CLI entry point with all global flags defined in the spec. The CLI should parse arguments, display version/help, and wire up the global options that all commands inherit.

## Acceptance Criteria
- [ ] `src/cli/index.ts` creates a Commander program named "ucli"
- [ ] Version is read from package.json
- [ ] All global flags are registered: --host, --api-key, --profile, --output/-o, --fields, --filter, --sort, --page, --page-size, --all, --timeout, --retry, --debug, --verbose/-v, --quiet/-q, --yes/-y, --force, --no-color
- [ ] `ucli --version` prints the version string
- [ ] `ucli --help` lists all registered command groups
- [ ] `src/cli/globals.ts` exports a type-safe GlobalOptions interface
- [ ] ESM entry point works (`node --loader ts-node/esm src/cli/index.ts` or via build)
- [ ] `tsc --noEmit` passes with zero errors

## Affected Files
- `src/cli/index.ts` (new)
- `src/cli/globals.ts` (new)

## Dependencies
None (first task)

## Implementation Notes
- Use Commander.js v13+
- OutputFormat type: 'human' | 'json' | 'yaml' | 'table'
- Default output: 'human'
- Default timeout: 30 (seconds)
- Default retry: 3
- --no-color should set chalk level to 0

## Validation
- `npm run typecheck` passes
- `npm run build` produces dist/cli/index.js
- Manual: `node dist/cli/index.js --version` prints version
- Manual: `node dist/cli/index.js --help` shows usage
