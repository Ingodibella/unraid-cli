# PRD: ucli (Unraid CLI)

## Problem
Unraid hat keine offizielle CLI. Die WebUI ist fuer Terminal-Power-User und Automation zu langsam und nicht skriptbar. Die GraphQL API existiert, aber es gibt kein Tool das sie zugaenglich macht.

## Loesung
`ucli` ist eine TypeScript CLI die die Unraid GraphQL API vollstaendig abbildet. Read-Commands fuer Monitoring, Write-Commands mit Safety Guards, Schema-Introspection fuer Debugging, deterministische Outputs fuer Automation.

## Zielgruppen
1. **Homelab Power Users:** SSH-Nutzer, schneller Status-Check, Terminal-Workflows
2. **Sysadmins/MSPs:** Skripting, Multi-Host (v2), Audit
3. **OSS Contributors:** Klares Domain-Modell, generierte Typen, gute DX
4. **AI-Agenten:** Deterministische Outputs (json/yaml), Schema-Introspection, MCP-Bridge (v2)

## Core Features (v1)

### Auth (auth)
- Login mit Host + API Key, Profile Management
- Credential Storage in ~/.config/ucli/credentials.yaml
- `whoami` und `test` fuer Diagnostics

### Read Commands (S0, keine Confirmation)
- `system info|status|health|uptime|resources|time|inspect`
- `array show|status|devices|inspect` + `parity status|history`
- `disks list|get|status|smart|usage|temp|inspect` + `assignable list`
- `containers list|get|status|inspect|logs|stats`
- `vms list|get|status|inspect`
- `shares list|get|usage|exports|inspect|cache-status`
- `notifications list|get|latest|watch`
- `logs list|get|tail|system|search`
- `network status|interfaces list|get|inspect`
- `services list|get|status|inspect`

### Write Commands (S1-S3, Safety Guards)
- `containers start|stop|restart|pause|unpause|remove` (S1-S2)
- `vms start|stop|pause|resume|reboot|reset|force-stop` (S1-S3)
- `array start|stop` (S2)
- `array parity check start|pause|resume|cancel` (S1-S2)
- `notifications archive|unarchive|unread|delete|create` (S1-S2)
- `disks mount|unmount|clear-stats` (S1-S2)

### Schema Tools (Killer Feature)
- `schema info|queries|mutations|type|fields|export|diff|validate`
- Live Introspection, Schema Diffing, Field Explorer

### Diagnostics
- `doctor` (connectivity, auth, schema, permissions)
- `ping`, `latency`, `permissions`, `env`
- `graphql --query <file>` (raw query execution)
- `bundle|support-report` (full diagnostics dump)

### Config
- `config show|path|get|set|unset|init`
- XDG-first: ~/.config/ucli/config.yaml
- Env overrides: UCLI_HOST, UCLI_API_KEY, UCLI_PROFILE

### Completions
- bash, zsh, fish, powershell

## Output Modes
- `human` (default): Farben, kompakt, stderr fuer Prosa
- `json`: Stabil, maschinenfreundlich, nur stdout
- `yaml`: Strukturiert, menschenfreundlich
- `table`: Explizit tabellarisch

## Global Flags
--host, --api-key, --profile, --output/-o, --fields, --filter, --sort, --page, --page-size, --all, --timeout, --retry, --debug, --verbose/-v, --quiet/-q, --yes/-y, --force, --no-color

## Exit Codes
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Runtime error |
| 2 | Invalid usage |
| 3 | Auth failure |
| 4 | Authorization failure |
| 5 | Not found |
| 6 | Conflict |
| 7 | Transport error |
| 8 | GraphQL error |
| 9 | Partial failure |
| 10 | Confirmation cancelled |

## Safety Classes
| Class | Behavior | Example |
|-------|----------|---------|
| S0 | Read-only, never prompt | system info, disks list |
| S1 | Reversible write, prompt in TTY, allow --yes | containers start |
| S2 | Critical, always require --yes | array stop |
| S3 | Destructive, require --yes --force | containers remove, vms force-stop |

## Non-Goals (v1)
- Multi-host context switching (v2)
- Fleet management (v2)
- Event streaming/subscriptions (v2)
- Plugin management (v2)
- MCP Bridge (v2)

## Technical Constraints
- Node.js >= 20
- TypeScript strict mode, ESM only
- GraphQL Codegen for type safety
- Schema is truth, never hardcode field names
- Rate limit: 100 req/10s, CLI must handle backoff
- API Version: locally v4.25.3, upstream v4.31.1+
