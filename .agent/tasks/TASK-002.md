# TASK-002: Config Loader + XDG Paths + Env Overrides

## Description
Implement the configuration system. Loads config from XDG-compliant paths, supports profiles, and respects environment variable overrides.

## Acceptance Criteria
- [ ] `src/core/config/loader.ts` loads config from `$XDG_CONFIG_HOME/ucli/config.yaml` (default: ~/.config/ucli/config.yaml)
- [ ] `src/core/config/env.ts` reads UCLI_HOST, UCLI_API_KEY, UCLI_PROFILE, UCLI_CONFIG env vars
- [ ] `src/core/config/profiles.ts` supports multiple named profiles with a default_profile setting
- [ ] `src/core/config/schema.ts` defines and validates the config schema shape
- [ ] Resolution order: CLI flags > env vars > active profile > default profile
- [ ] Missing config file is not an error (sensible defaults)
- [ ] Invalid config file produces a clear error message and exits with code 2
- [ ] $UCLI_CONFIG overrides the config file path entirely

## Affected Files
- `src/core/config/loader.ts` (new)
- `src/core/config/schema.ts` (new)
- `src/core/config/profiles.ts` (new)
- `src/core/config/env.ts` (new)
- `tests/unit/core/config.test.ts` (new)

## Dependencies
- TASK-001 (GlobalOptions type)

## Implementation Notes
- Use the `yaml` package for parsing
- Config schema:
  ```yaml
  default_profile: string
  profiles:
    <name>:
      host: string
      output: human|json|yaml|table
      timeout: number
  ```
- Provide a `resolveConfig(flags, env)` function that merges all sources

## Validation
- `tests/unit/core/config.test.ts` covers:
  - Loading a valid config file
  - Handling missing config file gracefully
  - Env var overrides
  - Profile resolution
  - Invalid config produces error
  - Flag overrides everything
