# ucli

The serious CLI for serious Unraid operators. Designed for humans AND agents.

ucli is a TypeScript CLI for Unraid Server, built on the Unraid 7.2+ GraphQL API. It exists because the WebUI is slow for repetitive work, SSH alone is too raw, and agents need structured output that does not fight back.

The command name is `ucli`.

## Features

- Built on the official Unraid GraphQL API
- Structured output in `json`, `yaml`, `table`, and human-readable formats
- Agent-first data shaping with `--fields`, `--filter`, and `--sort`
- Stateless execution, no REPL, no interactive shell state to keep in sync
- Non-interactive by default, suitable for scripts, cron jobs, CI, and agent workflows
- Auto-detects piped output and behaves cleanly in automation contexts
- Strong TypeScript types from schema-driven GraphQL operations
- Focused command surface for system, storage, containers, VMs, services, logs, and diagnostics

## Installation

### npm

```bash
npm install -g unraid-cli
```

Package publication is planned. Until then, install from source.

### From source

```bash
git clone https://github.com/ingodibella/unraid-cli.git
cd unraid-cli
npm install
npm run build
npm link
```

You can then use:

```bash
ucli --help
```

## Quick Start

Set your connection explicitly:

```bash
ucli --host http://192.168.1.10:7777 --api-key YOUR_API_KEY system info
```

Or use a config profile in `~/.config/ucli/config.yaml`:

```yaml
default_profile: lab
profiles:
  lab:
    host: http://192.168.1.10:7777
    apiKey: YOUR_API_KEY
    output: table
    timeout: 30
```

Examples:

```bash
ucli system info
ucli system info --output json
ucli containers list --output json --filter state=RUNNING --sort names:asc
ucli shares list --output yaml --fields name,used,free
ucli diagnostics doctor --output json --quiet
```

## Commands

ucli currently exposes 12 command groups:

- `system`: system info, health, status, resources, uptime
- `array`: array state, devices, parity, parity-check control
- `disks`: inventory, status, SMART data, temperature, usage, mount actions
- `containers`: list, inspect, logs, stats, lifecycle actions
- `notifications`: list, latest, get, create, archive, unread operations
- `vms`: list, inspect, state, lifecycle actions
- `shares`: list, get, usage
- `logs`: list, get, system logs, tail, search
- `services`: list, get, status
- `network`: interfaces and network status
- `schema`: inspect API queries, mutations, fields, types, validation
- `diagnostics`: ping, latency, env, GraphQL checks, permissions, doctor

Use `ucli <group> --help` or `ucli <group> <command> --help` for detailed syntax.

## Configuration

ucli resolves configuration in this order:

1. CLI flags
2. Environment variables
3. Active profile from config file
4. Default profile from config file
5. Built-in defaults

Default config path:

```text
~/.config/ucli/config.yaml
```

Relevant global flags:

- `--host`
- `--api-key`
- `--profile`
- `--output json|yaml|table|human`
- `--fields`
- `--filter`
- `--sort`
- `--page`, `--page-size`, `--all`
- `--timeout`, `--retry`
- `--quiet`, `--verbose`, `--debug`
- `--yes`, `--force`

Environment variables are supported for host, API key, profile, and config path. Check `ucli diagnostics env` and the source in `src/core/config` if you want the exact resolution behavior.

## Agent Integration

ucli is designed for agents, not just humans with a terminal fetish.

Use these defaults for automation:

```bash
ucli --output json --quiet <group> <command>
```

Why it works well in agent pipelines:

- JSON and YAML outputs are stable and easy to parse
- `--fields` reduces token waste
- `--filter` and `--sort` move data shaping into the CLI, not your prompt
- Non-interactive defaults prevent hanging workflows
- Stateless commands make retries simple
- Clean stderr and explicit exit codes make failure handling predictable

Example patterns:

```bash
ucli system health --output json --quiet
ucli containers list --output json --fields id,names,state,status --filter state=RUNNING
ucli notifications latest --output json --quiet
```

## Contributing

Contributions are welcome. Start with `CONTRIBUTING.md` for setup, test commands, and PR expectations.

## License

MIT. See `LICENSE`.
