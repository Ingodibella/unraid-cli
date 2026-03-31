# AGENTS.md

This document is for AI agents operating `ucli`.

ucli is a stateless CLI for Unraid Server, built for structured automation. Prefer explicit flags, machine-readable output, and short command chains over terminal heuristics.

## Recommended Defaults

For most agent workflows, start here:

```bash
ucli --output json --quiet <group> <command>
```

Why:

- `--output json` gives predictable machine-readable output
- `--quiet` suppresses non-essential text
- subcommands are stateless, so retrying is safe
- global flags work consistently across command groups

Add these when useful:

- `--fields` to reduce payload size
- `--filter` to narrow result sets before parsing
- `--sort` to get deterministic ordering
- `--page-size` or `--all` for pagination control
- `--timeout` and `--retry` for network-sensitive workflows

## Exit Codes

Treat exit code `0` as success.

Treat any non-zero exit code as failure and inspect stderr. ucli maps user-facing failures to explicit exit codes in the error layer, so agents should rely on process status first, then parse stderr only when needed.

Practical rule:

1. Check exit code.
2. If non-zero, capture stderr.
3. Retry only when the failure class is transient, for example latency or transport issues.
4. Do not assume partial success from human-readable output.

## Output Strategy

Use the smallest useful payload.

Examples:

```bash
ucli containers list --output json --fields id,names,state,status
ucli shares list --output json --fields name,used,free --sort name:asc
ucli notifications list --output json --filter importance=warning
```

Guidelines:

- Prefer `json` for agent parsing
- Use `yaml` only when downstream tooling expects YAML
- Avoid human output unless a person will read it directly
- Prefer `--fields` before post-processing in your own code
- Prefer `--filter` and `--sort` before loading large result sets into the model context

## Command Overview

Primary command groups for agent use:

- `system`: info, health, status, resources, uptime
- `array`: state, devices, parity, parity-check actions
- `disks`: inventory, SMART, temp, usage, mount state
- `containers`: list, inspect, logs, stats, start, stop, restart, pause, remove
- `notifications`: list, latest, get, create, archive, unread state
- `vms`: list, inspect, status, start, stop, reboot, pause, resume, reset
- `shares`: list, get, usage
- `logs`: list, get, system, tail, search
- `services`: list, get, status
- `network`: interfaces, status
- `schema`: API introspection and validation
- `diagnostics`: ping, latency, env, permissions, GraphQL, doctor

## Workflow: System Health Check

Use this when an operator or scheduler asks for a fast health snapshot.

```bash
ucli system info --output json --quiet
ucli system health --output json --quiet
ucli array status --output json --quiet
ucli services status --output json --quiet
```

Suggested agent pattern:

1. Fetch each command separately.
2. Fail fast on non-zero exit codes.
3. Summarize array state, service state, resource pressure, and notable warnings.
4. Only fetch logs if the health snapshot indicates trouble.

## Workflow: Container Management

Inspect, then act.

List running containers:

```bash
ucli containers list --output json --quiet --fields id,names,state,status --sort names:asc
```

Inspect one container:

```bash
ucli containers inspect <id> --output json --quiet
```

Restart a container:

```bash
ucli containers restart <id> --yes --output json --quiet
```

Recommended pattern:

1. Resolve the target container from `id` or `names`.
2. Inspect current state.
3. Execute the lifecycle command with `--yes` when confirmation could block automation.
4. Re-read status after mutation.

## Safety Notes

- Prefer read-only commands first
- Use `--yes` only for deliberate automation paths
- Pair destructive actions with explicit identifiers, never fuzzy matching in the shell
- Re-fetch state after any mutation, do not trust a prior cache

## Configuration Notes

ucli supports config profiles and environment variables. Default config path:

```text
~/.config/ucli/config.yaml
```

Typical config shape:

```yaml
default_profile: lab
profiles:
  lab:
    host: http://192.168.1.10:7777
    apiKey: YOUR_API_KEY
    output: json
    timeout: 30
```

When operating as an agent, prefer one of these approaches:

- pass `--host` and `--api-key` explicitly for isolated jobs
- use `--profile <name>` for stable environments
- keep `--output json` explicit even if the profile has another default
