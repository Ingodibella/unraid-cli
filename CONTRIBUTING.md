# Contributing

## Prerequisites

- Node.js 20+
- npm
- An Unraid 7.2+ server with a valid API key

## Setup

```bash
git clone https://github.com/ingodibella/unraid-cli.git
cd unraid-cli
npm install
```

## Development

```bash
npm run typecheck   # type checks
npm test            # 385 tests via vitest
npm run build       # compile TypeScript
npm run lint        # eslint
npm run format      # prettier
```

Source is TypeScript, ESM-only. The CLI talks to the Unraid GraphQL API.

## Pull requests

- Run `npm run typecheck` and `npm test` before opening a PR
- Add or update tests for behavior changes
- Keep docs in sync when commands or flags change
- Write commit messages that explain intent, not just files changed
- Small, focused changes preferred
