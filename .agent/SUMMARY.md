# ucli - Unraid CLI

## Was ist ucli?
Eine Open-Source CLI fuer Unraid Server, gebaut auf der offiziellen GraphQL API. Positionierung: "The serious CLI for serious Unraid operators."

## Stack
- **Sprache:** TypeScript (strict mode, ESM only)
- **CLI Framework:** Commander.js
- **GraphQL Client:** graphql-request
- **Type Generation:** GraphQL Codegen (aus Live-Schema oder Snapshot)
- **Testing:** Vitest
- **Output Formate:** human (default), json, yaml, table

## API Endpoint
- URL: `http://<unraid-host>:7777/graphql`
- Auth: API Key via `x-api-key` Header
- Rate Limit: 100 Requests / 10 Sekunden (nestjs/throttler)
- Schema ist die Wahrheit, Docs sind Orientierung

## Auth-Modell
- Drei Modi: API Keys (CLI-relevant), WebGUI Cookies, SSO/OIDC
- Rollen: ADMIN, CONNECT, VIEWER, GUEST
- CLI nutzt ausschliesslich API Keys
- Capability Detection: CLI prueft was der Key darf, bevor Commands angeboten werden

## Architektur
- Modularer Aufbau: commands/ (pro Domain), core/ (shared Infra), generated/ (Codegen Output)
- Safety Engine: S0 (read, nie prompt), S1 (reversible, prompt in TTY), S2 (kritisch, --yes), S3 (destruktiv, --yes --force)
- Output Layer: Renderer pro Format, stdout fuer Daten, stderr fuer Prosa/Fehler
- Config: XDG-first (~/.config/ucli/), Env-Override, Profile Support

## Exit Codes
0=success, 1=runtime error, 2=invalid usage, 3=auth failure, 4=authz failure, 5=not found, 6=conflict, 7=transport error, 8=GraphQL error, 9=partial failure, 10=confirmation cancelled

## Aktueller Stand
Phase 0: Scaffold und Design abgeschlossen. Noch kein funktionaler Code.
