import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { isValidApiKey, normalizeApiKey } from '../../../src/core/auth/api-key.js';
import {
  readCredentials,
  writeCredentials,
  getProfileApiKey,
  setProfileApiKey,
  getDefaultCredentialsPath,
} from '../../../src/core/auth/credentials.js';
import { resolveAuth, AuthError } from '../../../src/core/auth/resolver.js';

// Helpers
function makeTmpDir(): string {
  const dir = join(tmpdir(), `ucli-auth-test-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeCreds(dir: string, content: string): string {
  const path = join(dir, 'credentials.yaml');
  writeFileSync(path, content, 'utf-8');
  return path;
}

// ============================================================
// api-key.ts
// ============================================================

describe('isValidApiKey', () => {
  it('returns true for a non-empty string', () => {
    expect(isValidApiKey('abc123')).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(isValidApiKey('')).toBe(false);
  });

  it('returns false for a whitespace-only string', () => {
    expect(isValidApiKey('   ')).toBe(false);
  });

  it('returns false for non-string values', () => {
    expect(isValidApiKey(undefined)).toBe(false);
    expect(isValidApiKey(null)).toBe(false);
    expect(isValidApiKey(42)).toBe(false);
  });
});

describe('normalizeApiKey', () => {
  it('trims leading and trailing whitespace', () => {
    expect(normalizeApiKey('  key123  ')).toBe('key123');
  });

  it('returns unchanged string without whitespace', () => {
    expect(normalizeApiKey('mykey')).toBe('mykey');
  });
});

// ============================================================
// credentials.ts
// ============================================================

describe('getDefaultCredentialsPath', () => {
  it('uses XDG_CONFIG_HOME when set', () => {
    const path = getDefaultCredentialsPath({ XDG_CONFIG_HOME: '/custom/xdg' });
    expect(path).toBe('/custom/xdg/ucli/credentials.yaml');
  });

  it('falls back to ~/.config when XDG_CONFIG_HOME is not set', () => {
    const path = getDefaultCredentialsPath({});
    expect(path).toMatch(/\.config\/ucli\/credentials\.yaml$/);
  });
});

describe('readCredentials', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }); });

  it('returns empty object when file does not exist', () => {
    const result = readCredentials(join(tmpDir, 'nonexistent.yaml'));
    expect(result).toEqual({});
  });

  it('parses a valid credentials file', () => {
    const path = writeCreds(tmpDir, `
profiles:
  home:
    api_key: "secret-key"
`);
    const result = readCredentials(path);
    expect(result.profiles?.['home']?.api_key).toBe('secret-key');
  });

  it('returns empty object for empty file', () => {
    const path = writeCreds(tmpDir, '');
    const result = readCredentials(path);
    expect(result).toEqual({});
  });

  it('throws CredentialsError for invalid YAML', async () => {
    const path = writeCreds(tmpDir, ': invalid: yaml: {{{');
    const { CredentialsError } = await import('../../../src/core/auth/credentials.js');
    expect(() => readCredentials(path)).toThrow(CredentialsError);
  });
});

describe('writeCredentials', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }); });

  it('creates the file and parent directories', () => {
    const path = join(tmpDir, 'subdir', 'credentials.yaml');
    writeCredentials(path, { profiles: { home: { api_key: 'abc' } } });
    expect(existsSync(path)).toBe(true);
  });

  it('sets file permissions to 0600', () => {
    const path = join(tmpDir, 'credentials.yaml');
    writeCredentials(path, { profiles: { home: { api_key: 'abc' } } });
    const mode = statSync(path).mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it('writes content that can be read back', () => {
    const path = join(tmpDir, 'credentials.yaml');
    const data = { profiles: { home: { api_key: 'secret' } } };
    writeCredentials(path, data);
    const result = readCredentials(path);
    expect(result.profiles?.['home']?.api_key).toBe('secret');
  });

  it('overwrites existing file', () => {
    const path = writeCreds(tmpDir, `profiles:\n  old:\n    api_key: old`);
    writeCredentials(path, { profiles: { new: { api_key: 'new-key' } } });
    const result = readCredentials(path);
    expect(result.profiles?.['new']?.api_key).toBe('new-key');
    expect(result.profiles?.['old']).toBeUndefined();
  });
});

describe('getProfileApiKey', () => {
  it('returns the api_key for a known profile', () => {
    const creds = { profiles: { home: { api_key: 'mykey' } } };
    expect(getProfileApiKey(creds, 'home')).toBe('mykey');
  });

  it('returns undefined for an unknown profile', () => {
    const creds = { profiles: { home: { api_key: 'mykey' } } };
    expect(getProfileApiKey(creds, 'nonexistent')).toBeUndefined();
  });

  it('returns undefined when profiles is empty', () => {
    expect(getProfileApiKey({}, 'home')).toBeUndefined();
  });
});

describe('setProfileApiKey', () => {
  it('adds a new profile', () => {
    const result = setProfileApiKey({}, 'home', 'key1');
    expect(result.profiles?.['home']?.api_key).toBe('key1');
  });

  it('updates an existing profile', () => {
    const creds = { profiles: { home: { api_key: 'old' } } };
    const result = setProfileApiKey(creds, 'home', 'new');
    expect(result.profiles?.['home']?.api_key).toBe('new');
  });

  it('preserves other profiles', () => {
    const creds = { profiles: { a: { api_key: 'akey' }, b: { api_key: 'bkey' } } };
    const result = setProfileApiKey(creds, 'b', 'updated');
    expect(result.profiles?.['a']?.api_key).toBe('akey');
    expect(result.profiles?.['b']?.api_key).toBe('updated');
  });

  it('does not mutate the original', () => {
    const creds = { profiles: { home: { api_key: 'original' } } };
    setProfileApiKey(creds, 'home', 'changed');
    expect(creds.profiles?.['home']?.api_key).toBe('original');
  });
});

// ============================================================
// resolver.ts
// ============================================================

describe('resolveAuth', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }); });

  function makeCredPath(apiKey: string, profile = 'default'): string {
    const path = join(tmpDir, 'credentials.yaml');
    writeCredentials(path, { profiles: { [profile]: { api_key: apiKey } } });
    return path;
  }

  it('uses --api-key flag (highest priority)', () => {
    const credPath = makeCredPath('cred-key');
    const result = resolveAuth(
      { host: 'myhost', apiKey: 'flag-key' },
      { env: { UCLI_API_KEY: 'env-key' }, credentialsPath: credPath }
    );
    expect(result.apiKey).toBe('flag-key');
    expect(result.host).toBe('myhost');
  });

  it('uses UCLI_API_KEY env var when no flag provided', () => {
    const credPath = makeCredPath('cred-key');
    const result = resolveAuth(
      { host: 'myhost' },
      { env: { UCLI_API_KEY: 'env-key', UCLI_HOST: 'myhost' }, credentialsPath: credPath }
    );
    expect(result.apiKey).toBe('env-key');
  });

  it('uses profile credentials when no flag or env var', () => {
    const credPath = makeCredPath('profile-key');
    const result = resolveAuth(
      { host: 'myhost', profile: 'default' },
      { env: {}, credentialsPath: credPath }
    );
    expect(result.apiKey).toBe('profile-key');
  });

  it('resolves host from UCLI_HOST env when no flag', () => {
    const credPath = makeCredPath('profile-key');
    const result = resolveAuth(
      { profile: 'default' },
      { env: { UCLI_HOST: 'env-host' }, credentialsPath: credPath }
    );
    expect(result.host).toBe('env-host');
  });

  it('throws AuthError when no host is configured', () => {
    expect(() =>
      resolveAuth({ apiKey: 'some-key' }, { env: {} })
    ).toThrow(AuthError);
  });

  it('AuthError has exitCode 3', () => {
    try {
      resolveAuth({ apiKey: 'some-key' }, { env: {} });
    } catch (err) {
      expect((err as AuthError).exitCode).toBe(3);
    }
  });

  it('throws AuthError when credentials file is missing and no env/flag', () => {
    const missingPath = join(tmpDir, 'no-such-file.yaml');
    expect(() =>
      resolveAuth(
        { host: 'myhost', profile: 'default' },
        { env: {}, credentialsPath: missingPath }
      )
    ).toThrow(AuthError);
  });

  it('throws AuthError when profile has no api_key', () => {
    const path = join(tmpDir, 'credentials.yaml');
    writeCredentials(path, { profiles: { other: { api_key: 'other-key' } } });
    expect(() =>
      resolveAuth(
        { host: 'myhost', profile: 'default' },
        { env: {}, credentialsPath: path }
      )
    ).toThrow(AuthError);
  });

  it('error message mentions ucli auth login', () => {
    try {
      resolveAuth({ host: 'myhost', profile: 'missing' }, { env: {}, credentialsPath: join(tmpDir, 'x.yaml') });
    } catch (err) {
      expect((err as AuthError).message).toMatch(/ucli auth login/);
    }
  });

  it('trims whitespace from host and api-key flag', () => {
    const result = resolveAuth(
      { host: '  myhost  ', apiKey: '  trimmed-key  ' },
      { env: {} }
    );
    expect(result.host).toBe('myhost');
    expect(result.apiKey).toBe('trimmed-key');
  });

  it('flag overrides env api key', () => {
    const credPath = makeCredPath('cred-key');
    const result = resolveAuth(
      { host: 'h', apiKey: 'flag' },
      { env: { UCLI_API_KEY: 'env' }, credentialsPath: credPath }
    );
    expect(result.apiKey).toBe('flag');
  });

  it('env api key overrides profile credential', () => {
    const credPath = makeCredPath('cred-key');
    const result = resolveAuth(
      { host: 'h' },
      { env: { UCLI_API_KEY: 'env-wins' }, credentialsPath: credPath }
    );
    expect(result.apiKey).toBe('env-wins');
  });
});
