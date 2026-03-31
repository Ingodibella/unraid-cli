# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [0.1.0] - 2026-03-31

Initial public release.

### Commands

- `system` - info, health, status, resources, uptime
- `array` - state, devices, parity, parity-check control
- `disks` - inventory, SMART, temperature, usage, mount actions
- `containers` - list, inspect, logs, stats, lifecycle actions
- `notifications` - list, latest, create, archive, unread ops
- `vms` - list, inspect, state, lifecycle actions
- `shares` - list, get, usage
- `logs` - list, get, system, tail, search
- `services` - list, get, status
- `network` - interfaces and network status
- `schema` - API introspection and validation
- `diagnostics` - ping, latency, env, GraphQL checks, permissions, doctor
- `auth` - API key management
- `config` - profile and config management
- `completion` - shell completions

### Features

- Output formats: json, yaml, table, human-readable
- Agent-first flags: --fields, --filter, --sort
- Non-interactive by default
- Stateless execution (no REPL, no session state)
- Retry logic with configurable timeout
