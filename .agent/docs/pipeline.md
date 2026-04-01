# npm publish pipeline

## GitHub Actions workflow

The repository uses `.github/workflows/publish.yml` to publish `unraid-cli` to npm on every push to `main`.

Workflow summary:

1. Checkout the repository with enough history to compare the previous `package.json` version.
2. Run `npm ci`.
3. Run `npm run check`.
4. If the version in `package.json` was not changed in the pushed commit, bump the patch version automatically.
5. Tag the release as `v<version>`.
6. Publish to npm.
7. Push the release commit and tags back to `main`.

## Required secret: `NPM_TOKEN`

Set up an npm access token and store it as a GitHub repository secret.

### 1. Create the npm token

1. Sign in to npm.
2. Open `https://www.npmjs.com/settings/tokens`.
3. Create a token with read and write access for package publishing.
4. If npm enforces 2FA for publishing, use a token that supports 2FA bypass for automation.

### 2. Add the token to GitHub

1. Open the GitHub repository.
2. Go to **Settings**.
3. Open **Secrets and variables** > **Actions**.
4. Click **New repository secret**.
5. Name the secret `NPM_TOKEN`.
6. Paste the npm token value.
7. Save the secret.

### 3. How the workflow uses it

The workflow maps the secret to `NODE_AUTH_TOKEN` and configures npm with:

```bash
npm config set "//registry.npmjs.org/:_authToken=$NODE_AUTH_TOKEN"
```

That allows `npm publish` to authenticate against the npm registry without interactive login.
