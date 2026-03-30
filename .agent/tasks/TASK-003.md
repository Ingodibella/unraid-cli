# TASK-003: Auth Resolver + Credential Storage

## Description
Implement credential storage and auth resolution. Credentials live in a separate file from config, with proper file permissions. The auth resolver chains multiple credential sources.

## Acceptance Criteria
- [ ] `src/core/auth/credentials.ts` reads/writes `~/.config/ucli/credentials.yaml`
- [ ] Credential file is created with 0600 permissions on write
- [ ] `src/core/auth/resolver.ts` resolves credentials in order: --api-key flag > UCLI_API_KEY env > profile credentials
- [ ] `src/core/auth/api-key.ts` validates API key format (non-empty string)
- [ ] Missing credentials produce exit code 3 with a helpful message pointing to `ucli auth login`
- [ ] Credentials schema: `profiles.<name>.api_key: string`

## Affected Files
- `src/core/auth/resolver.ts` (new)
- `src/core/auth/credentials.ts` (new)
- `src/core/auth/api-key.ts` (new)
- `tests/unit/core/auth.test.ts` (new)

## Dependencies
- TASK-002 (Config loader, profile resolution)

## Implementation Notes
- Credential file format:
  ```yaml
  profiles:
    home:
      api_key: "the-key"
  ```
- Use `fs.chmod` or write with mode option for 0600
- The resolver returns `{ host: string, apiKey: string }` or throws AuthError

## Validation
- `tests/unit/core/auth.test.ts` covers:
  - Flag override takes priority
  - Env var override works
  - Profile credential loading
  - Missing credential produces AuthError
  - File permissions are set correctly on write
