# Contributing

Thanks for contributing to ucli.

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

Useful commands:

```bash
npm run typecheck
npm test
npm run build
```

## Development Notes

- Source is TypeScript, ESM-only
- The CLI talks to the Unraid GraphQL API
- Prefer small, focused changes
- Keep output predictable, especially for `--output json`

## Pull Request Guidelines

- Run `npm run typecheck` and `npm test` before opening a PR
- Add or update tests for behavior changes
- Keep docs in sync when commands or flags change
- Write commit messages that explain intent, not just files changed
