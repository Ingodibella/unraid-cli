---
name: ucli
description: |
  Stateless CLI for Unraid Server (7.2+ GraphQL API).
  Use when the user asks about Unraid system status, containers, VMs, storage,
  notifications, logs, or any server management task.
version: "0.1.0"
metadata:
  author: Ingodibella
---

# ucli agent guide

CLI: `ucli [global flags] <group> <command> [args...]`

## Recommended defaults

```bash
ucli --output json --quiet <group> <command>
```

- `--output json` for machine-readable output
- `--quiet` to suppress decorative text
- `--fields` to shrink payloads
- `--filter` and `--sort` to shape data before it hits your context

## Guardrails

- Prefer read-only commands first. Inspect before acting.
- Use `--yes` only in deliberate automation paths, never speculatively.
- Pair destructive actions with explicit identifiers. No fuzzy matching in the shell.
- Re-fetch state after any mutation. Do not trust a prior cache.
- Treat exit code `0` as success. Non-zero: capture stderr, retry only on transient failures.

## Command groups

| Group | Typical use |
|---|---|
| `system` | `info`, `health`, `status`, `resources`, `uptime` |
| `array` | `status`, `devices`, `parity`, parity-check actions |
| `disks` | Inventory, SMART, temp, usage, mount |
| `containers` | `list`, `inspect`, `logs`, `stats`, lifecycle actions |
| `notifications` | `list`, `latest`, `get`, `create`, `archive` |
| `vms` | `list`, `inspect`, lifecycle actions |
| `shares` | `list`, `get`, usage |
| `logs` | `list`, `get`, `system`, `tail`, `search` |
| `services` | `list`, `get`, `status` |
| `network` | Interfaces, status |
| `schema` | API introspection |
| `diagnostics` | `ping`, `latency`, `env`, `doctor` |

## Workflow: health check

```bash
ucli system info --output json --quiet
ucli system health --output json --quiet
ucli array status --output json --quiet
ucli services status --output json --quiet
```

1. Fetch each separately. Fail fast on non-zero exits.
2. Summarize array state, service state, resource pressure, warnings.
3. Only pull logs if the snapshot shows trouble.

## Workflow: container management

```bash
# list running
ucli containers list --output json --quiet --fields id,names,state,status --sort names:asc

# inspect one
ucli containers inspect <id> --output json --quiet

# restart
ucli containers restart <id> --yes --output json --quiet
```

1. Resolve target by `id` or `names`.
2. Inspect current state.
3. Execute with `--yes` when confirmation would block automation.
4. Re-read status after mutation.

## Anti-patterns

- Don't parse human-readable output. Always use `--output json`.
- Don't assume partial success from human-readable text. Check exit codes.
- Don't retry on non-transient errors (auth, bad arguments, missing resources).
- Don't skip `--fields` on large result sets. Token waste adds up fast.
- Don't chain mutations without re-fetching state between them.
- Don't use `--force` unless you understand exactly what it skips.

## Configuration

Default config path: `~/.config/ucli/config.yaml`

```yaml
default_profile: lab
profiles:
  lab:
    host: http://192.168.1.10:7777
    apiKey: YOUR_API_KEY
    output: json
    timeout: 30
```

Prefer `--host` and `--api-key` explicitly for isolated jobs, `--profile <name>` for stable environments.
