# Architecture Design: ucli

## Module Layout

```
src/
  cli/                        # CLI entry point, global flags, program setup
    index.ts                  # Main entry, Commander program, global options
    globals.ts                # Global flag parsing and validation

  commands/                   # One directory per domain
    auth/                     # login, logout, whoami, test, profiles
    system/                   # info, status, health, uptime, resources, time, inspect
    array/                    # show, status, devices, inspect, parity (sub-group)
    disks/                    # list, get, status, smart, usage, temp, inspect, mount, unmount
    containers/               # list, get, status, inspect, logs, stats, start, stop, etc.
    vms/                      # list, get, status, inspect, start, stop, pause, etc.
    shares/                   # list, get, usage, exports, inspect, cache-status
    notifications/            # list, get, latest, watch, create, archive, delete, etc.
    logs/                     # list, get, tail, system, search
    network/                  # status, interfaces, remote-access
    services/                 # list, get, status, inspect
    schema/                   # info, queries, mutations, type, fields, export, diff, validate
    diagnostics/              # doctor, ping, latency, permissions, env, graphql, bundle
    config/                   # show, path, get, set, unset, init
    completion/               # bash, zsh, fish, powershell

  core/                       # Shared infrastructure
    graphql/                  # GraphQL client, query builder, introspection
      client.ts               # Core GraphQL client (endpoint, auth, timeouts, retries)
      introspection.ts        # Schema introspection utilities
      operations.ts           # Curated operations registry
    transport/                # HTTP transport, retry logic, rate limiting
      http.ts                 # HTTP client wrapper
      retry.ts                # Retry with backoff (reads only)
      rate-limit.ts           # Rate limit detection and backoff
    auth/                     # Auth resolution, credential management
      resolver.ts             # Auth chain: flag > env > profile > config
      credentials.ts          # Credential file read/write
      api-key.ts              # API key validation
    config/                   # Configuration management
      loader.ts               # Config file loading (XDG paths)
      schema.ts               # Config schema definition
      profiles.ts             # Profile management
      env.ts                  # Environment variable overrides
    output/                   # Output formatting layer
      renderer.ts             # Renderer interface and dispatch
      human.ts                # Human-readable output (colors, compact)
      json.ts                 # JSON output (stable, stdout only)
      yaml.ts                 # YAML output
      table.ts                # Table output (cli-table3)
      fields.ts               # Field selection (--fields)
    errors/                   # Error handling and mapping
      codes.ts                # Exit code constants (0-10)
      graphql-errors.ts       # GraphQL error normalization
      transport-errors.ts     # Network/HTTP error handling
      user-errors.ts          # User-facing error formatting
    safety/                   # Safety engine
      classifier.ts           # Safety class registry (S0-S3)
      confirmation.ts         # Confirmation prompts (TTY detection)
      guards.ts               # Pre-execution safety guards
    filters/                  # Filtering, sorting, pagination
      filter.ts               # --filter parsing and application
      sort.ts                 # --sort parsing and application
      paging.ts               # --page, --page-size, --all handling
    paging/                   # (alias or extended paging logic)
    capabilities/             # Capability detection
      detector.ts             # API version check, permission preflight
      schema-version.ts       # Schema version tracking

  generated/                  # GraphQL Codegen output (auto-generated)
    types.ts                  # Generated TypeScript types from schema
    operations.ts             # Generated query/mutation types

  plugins/                    # Plugin system (v2, placeholder)
  mcp/                        # MCP Bridge (v2, placeholder)
```

## GraphQL Client Design

### Responsibilities
1. **Endpoint Resolution:** Config > Env > Flag > Default
2. **Auth Injection:** Automatic `x-api-key` header from resolved credentials
3. **Timeout Management:** Per-request timeout (default 30s), configurable via --timeout
4. **Retry Logic:** Only for read operations (S0). Exponential backoff. Max 3 retries.
5. **Request IDs:** UUID per request for correlation in debug mode
6. **Debug Logging:** Full request/response logging when --debug is set (stderr)
7. **Error Normalization:** GraphQL errors, HTTP errors, timeouts all map to typed error objects
8. **Introspection:** On-demand schema fetch for schema commands and capability detection

### Architecture
```
CommandHandler
  -> GraphQLClient.execute(operation, variables)
    -> AuthResolver.getCredentials()
    -> HttpTransport.send(request)
      -> RetryHandler (reads only)
      -> RateLimitHandler
    -> ErrorNormalizer.normalize(response)
  -> OutputRenderer.render(data, format)
```

### Key Decisions
- **graphql-request** as HTTP client (lightweight, typed, ESM-native)
- Operations are curated per command, not freeform (exception: `diagnostics graphql`)
- Schema snapshot stored locally for offline type generation
- Client is stateless per invocation (CLI is not a long-running process)

## Output Layer Design

### Renderer Interface
```typescript
interface OutputRenderer {
  render(data: unknown, options: RenderOptions): string;
}

interface RenderOptions {
  fields?: string[];      // --fields selection
  format: OutputFormat;   // human | json | yaml | table
  noColor?: boolean;      // --no-color
  quiet?: boolean;        // --quiet
  verbose?: boolean;      // --verbose
}
```

### Dispatch Logic
1. Check --output flag (explicit format)
2. Check if stdout is TTY (human) or pipe (json)
3. Human renderer for interactive, json for pipes (unless overridden)
4. All data output goes to stdout
5. All diagnostic/error/debug output goes to stderr

### Human Renderer
- Chalk for colors
- Compact layout (key: value, not tables by default)
- Contextual formatting (temperatures with units, sizes with human units)
- Status indicators (green/yellow/red dots)

### Table Renderer
- cli-table3 for structured tabular output
- Column auto-width
- Sortable by any column

### JSON Renderer
- JSON.stringify with 2-space indent
- Stable key ordering
- No extra output (no "fetching..." messages)

### YAML Renderer
- yaml library for serialization
- Same data structure as JSON

## Safety Engine Design

### Classification Registry
Each command registers its safety class:
```typescript
const SAFETY_REGISTRY = {
  'system.info': SafetyClass.S0,
  'containers.start': SafetyClass.S1,
  'array.stop': SafetyClass.S2,
  'containers.remove': SafetyClass.S3,
  // ...
};
```

### Confirmation Flow
```
S0: Execute immediately, no prompt
S1: If TTY -> prompt "Continue? [y/N]". If --yes -> skip prompt. If pipe -> abort with exit 10
S2: Always require --yes flag. Prompt even in TTY requires explicit flag.
S3: Require both --yes AND --force. Extra warning message.
```

### TTY Detection
- `process.stdout.isTTY` for interactive detection
- Pipe mode: never prompt, require explicit flags
- Respect --yes and --force flags

## Config/Auth Flow

### Config Resolution Order (highest wins)
1. CLI flags (--host, --api-key)
2. Environment variables (UCLI_HOST, UCLI_API_KEY)
3. Active profile in config.yaml
4. Default profile

### File Locations (XDG)
- Config: `$XDG_CONFIG_HOME/ucli/config.yaml` (default: ~/.config/ucli/config.yaml)
- Credentials: `$XDG_CONFIG_HOME/ucli/credentials.yaml` (same dir, separate file)
- Override: `$UCLI_CONFIG` env var

### Config Schema
```yaml
# config.yaml
default_profile: home
profiles:
  home:
    host: http://192.168.1.100:7777
    output: human
    timeout: 30
  office:
    host: http://10.0.0.5:7777
    output: json
```

### Credentials Schema
```yaml
# credentials.yaml (permissions: 0600)
profiles:
  home:
    api_key: "YOUR_API_KEY"
  office:
    api_key: "YOUR_API_KEY"
```

### Auth Flow
```
1. CLI invoked
2. Resolve config (flags > env > profile)
3. Resolve credentials (flag > env > credentials file)
4. If no credentials found: exit 3 (auth failure) with helpful message
5. Inject x-api-key header into GraphQL client
6. If 401/403 response: exit 3 or 4 with specific message
```

## Command Registration

### Pattern
Each command domain is a directory with an `index.ts` that exports a Commander command group:

```typescript
// src/commands/system/index.ts
import { Command } from 'commander';
import { infoCommand } from './info.js';
import { statusCommand } from './status.js';

export function systemCommand(): Command {
  const cmd = new Command('system')
    .description('System information and management');
  cmd.addCommand(infoCommand());
  cmd.addCommand(statusCommand());
  return cmd;
}
```

### Command Structure
Each subcommand file exports a factory function:
```typescript
// src/commands/system/info.ts
export function infoCommand(): Command {
  return new Command('info')
    .description('Show system information')
    .action(async (options) => {
      // 1. Resolve config + auth
      // 2. Execute GraphQL query
      // 3. Render output
    });
}
```

### Registration in CLI Entry
```typescript
// src/cli/index.ts
import { systemCommand } from '../commands/system/index.js';
import { arrayCommand } from '../commands/array/index.js';
// ...

const program = new Command('ucli')
  .version(version)
  .description('The serious CLI for serious Unraid operators');

program.addCommand(systemCommand());
program.addCommand(arrayCommand());
// ... all domains
```

### Key Principles
- One file per subcommand (small, testable)
- Command files only orchestrate: resolve config, call client, render output
- Business logic lives in core/ modules
- GraphQL operations are curated in generated/ or core/graphql/operations.ts
- No inline GraphQL strings in command files
