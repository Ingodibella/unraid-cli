# ucli

The serious CLI for serious Unraid operators.

Built on the official Unraid GraphQL API. Faster than the WebUI for terminal workflows, stable for automation, open for community extensions.

## Status

**Pre-alpha.** Architecture and task breakdown phase. No functional code yet.

## Stack

- TypeScript (strict mode, ESM only)
- Commander.js (CLI framework)
- graphql-request (GraphQL client)
- Vitest (testing)
- GraphQL Codegen (type generation from schema)

## API

Talks to the Unraid GraphQL API at your server's port 7777. Authenticated via API keys (`x-api-key` header).

## License

MIT
