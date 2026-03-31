import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  loadConfigFile,
  resolveConfig,
  getDefaultConfigPath,
  getXdgConfigHome,
  checkConfigFilePermissions,
} from '../../../src/core/config/loader.js';
import { validateConfig, ConfigValidationError } from '../../../src/core/config/schema.js';
import { readEnvConfig } from '../../../src/core/config/env.js';
import { resolveProfile, listProfiles } from '../../../src/core/config/profiles.js';

// Helpers
function makeTmpDir(): string {
  const dir = join(tmpdir(), `ucli-test-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeConfig(dir: string, content: string): string {
  const path = join(dir, 'config.yaml');
  writeFileSync(path, content, 'utf-8');
  chmodSync(path, 0o600);
  return path;
}

describe('getXdgConfigHome', () => {
  it('returns XDG_CONFIG_HOME when set', () => {
    expect(getXdgConfigHome({ XDG_CONFIG_HOME: '/custom/xdg' })).toBe('/custom/xdg');
  });

  it('falls back to ~/.config when not set', () => {
    const result = getXdgConfigHome({});
    expect(result).toMatch(/\.config$/);
  });
});

describe('getDefaultConfigPath', () => {
  it('returns path under XDG_CONFIG_HOME', () => {
    const path = getDefaultConfigPath({ XDG_CONFIG_HOME: '/custom' });
    expect(path).toBe('/custom/ucli/config.yaml');
  });
});

describe('readEnvConfig', () => {
  it('reads all UCLI_ vars', () => {
    const result = readEnvConfig({
      UCLI_HOST: 'http://my-server:7777',
      UCLI_API_KEY: 'secret-key',
      UCLI_PROFILE: 'staging',
      UCLI_CONFIG: '/custom/path.yaml',
    });
    expect(result).toEqual({
      host: 'http://my-server:7777',
      apiKey: 'secret-key',
      profile: 'staging',
      configPath: '/custom/path.yaml',
    });
  });

  it('returns empty object when no vars set', () => {
    expect(readEnvConfig({})).toEqual({});
  });

  it('ignores unrelated vars', () => {
    expect(readEnvConfig({ HOME: '/home/user', PATH: '/usr/bin' })).toEqual({});
  });
});

describe('validateConfig', () => {
  it('accepts empty/null config', () => {
    expect(validateConfig(null)).toEqual({});
    expect(validateConfig(undefined)).toEqual({});
  });

  it('accepts a valid config', () => {
    const config = validateConfig({
      default_profile: 'home',
      profiles: {
        home: {
          host: 'http://tower:7777',
          output: 'json',
          timeout: 60,
        },
      },
    });
    expect(config.default_profile).toBe('home');
    expect(config.profiles?.['home']?.host).toBe('http://tower:7777');
  });

  it('normalizes api_key to apiKey', () => {
    const config = validateConfig({
      default_profile: 'tower',
      profiles: {
        tower: {
          host: 'http://tower:7777',
          api_key: 'snake-key',
        },
      },
    });

    expect(config.profiles?.['tower']).toEqual({
      host: 'http://tower:7777',
      apiKey: 'snake-key',
    });
  });

  it('throws on non-object input', () => {
    expect(() => validateConfig('not an object')).toThrow(ConfigValidationError);
    expect(() => validateConfig(42)).toThrow(ConfigValidationError);
    expect(() => validateConfig([])).toThrow(ConfigValidationError);
  });

  it('throws when default_profile is not a string', () => {
    expect(() => validateConfig({ default_profile: 123 })).toThrow(ConfigValidationError);
  });

  it('throws when profiles is not a mapping', () => {
    expect(() => validateConfig({ profiles: 'not-an-object' })).toThrow(ConfigValidationError);
  });

  it('throws when a profile has invalid output format', () => {
    expect(() =>
      validateConfig({ profiles: { bad: { output: 'invalid-format' } } })
    ).toThrow(ConfigValidationError);
  });

  it('throws when a profile timeout is not a positive number', () => {
    expect(() =>
      validateConfig({ profiles: { bad: { timeout: -5 } } })
    ).toThrow(ConfigValidationError);
  });
});

describe('loadConfigFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty config for non-existent file', () => {
    const result = loadConfigFile(join(tmpDir, 'does-not-exist.yaml'));
    expect(result).toEqual({});
  });

  it('loads a valid config file', () => {
    const path = writeConfig(
      tmpDir,
      `
default_profile: home
profiles:
  home:
    host: http://tower:7777
    output: json
    timeout: 45
`
    );
    const config = loadConfigFile(path);
    expect(config.default_profile).toBe('home');
    expect(config.profiles?.['home']?.host).toBe('http://tower:7777');
    expect(config.profiles?.['home']?.output).toBe('json');
    expect(config.profiles?.['home']?.timeout).toBe(45);
  });

  it('throws ConfigValidationError for invalid YAML', () => {
    const path = writeConfig(tmpDir, ': bad: yaml: [unclosed');
    expect(() => loadConfigFile(path)).toThrow(ConfigValidationError);
  });

  it('throws ConfigValidationError for semantically invalid config', () => {
    const path = writeConfig(tmpDir, 'default_profile: 12345\n');
    expect(() => loadConfigFile(path)).toThrow(ConfigValidationError);
  });

  it('throws ConfigValidationError for insecure config file permissions', () => {
    if (process.platform === 'win32') {
      return;
    }

    const path = writeConfig(tmpDir, 'default_profile: home\n');
    chmodSync(path, 0o644);
    process.env['UCLI_STRICT_PERMISSIONS'] = 'true';
    try {
      expect(() => loadConfigFile(path)).toThrow(ConfigValidationError);
    } finally {
      delete process.env['UCLI_STRICT_PERMISSIONS'];
    }
  });
});

describe('resolveProfile', () => {
  const config = {
    default_profile: 'home',
    profiles: {
      home: { host: 'http://tower:7777', output: 'human' as const },
      work: { host: 'http://workserver:7777', output: 'json' as const },
    },
  };

  it('resolves named profile explicitly', () => {
    const profile = resolveProfile(config, 'work');
    expect(profile?.host).toBe('http://workserver:7777');
  });

  it('falls back to default_profile', () => {
    const profile = resolveProfile(config);
    expect(profile?.host).toBe('http://tower:7777');
  });

  it('returns undefined when no profile matches', () => {
    const profile = resolveProfile(config, 'nonexistent');
    expect(profile).toBeUndefined();
  });

  it('returns undefined when no profiles and no default', () => {
    expect(resolveProfile({})).toBeUndefined();
  });

  it('listProfiles returns all profile names', () => {
    expect(listProfiles(config)).toEqual(['home', 'work']);
  });

  it('listProfiles returns empty array when no profiles', () => {
    expect(listProfiles({})).toEqual([]);
  });
});

describe('resolveConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns defaults when no config and no env', () => {
    const env = { XDG_CONFIG_HOME: tmpDir }; // no config file exists
    const result = resolveConfig({}, env);
    expect(result.output).toBe('human');
    expect(result.timeout).toBe(30);
    expect(result.host).toBeUndefined();
  });

  it('reads host and apiKey from env vars', () => {
    const env = {
      XDG_CONFIG_HOME: tmpDir,
      UCLI_HOST: 'http://env-server:7777',
      UCLI_API_KEY: 'env-key',
    };
    const result = resolveConfig({}, env);
    expect(result.host).toBe('http://env-server:7777');
    expect(result.apiKey).toBe('env-key');
  });

  it('uses active profile from config file', () => {
    const configDir = join(tmpDir, 'ucli');
    mkdirSync(configDir, { recursive: true });
    const configPath = join(configDir, 'config.yaml');
    writeFileSync(
      configPath,
      `
default_profile: home
profiles:
  home:
    host: http://tower:7777
    output: table
    timeout: 60
`
    );
    if (process.platform !== 'win32') chmodSync(configPath, 0o600);
    const env = { XDG_CONFIG_HOME: tmpDir };
    const result = resolveConfig({}, env);
    expect(result.host).toBe('http://tower:7777');
    expect(result.output).toBe('table');
    expect(result.timeout).toBe(60);
    expect(result.profile).toBe('home');
  });

  it('CLI flags override env vars and profile', () => {
    const configDir = join(tmpDir, 'ucli');
    mkdirSync(configDir, { recursive: true });
    const configPath = join(configDir, 'config.yaml');
    writeFileSync(
      configPath,
      `
default_profile: home
profiles:
  home:
    host: http://tower:7777
    output: table
`
    );
    if (process.platform !== 'win32') chmodSync(configPath, 0o600);
    const env = {
      XDG_CONFIG_HOME: tmpDir,
      UCLI_HOST: 'http://env-server:7777',
    };
    const result = resolveConfig({ host: 'http://flag-server:7777', output: 'json' }, env);
    expect(result.host).toBe('http://flag-server:7777');
    expect(result.output).toBe('json');
  });

  it('env vars override profile values', () => {
    const configDir = join(tmpDir, 'ucli');
    mkdirSync(configDir, { recursive: true });
    writeFileSync(
      join(configDir, 'config.yaml'),
      `
default_profile: home
profiles:
  home:
    host: http://tower:7777
`
    );
    const env = {
      XDG_CONFIG_HOME: tmpDir,
      UCLI_HOST: 'http://env-override:7777',
    };
    const result = resolveConfig({}, env);
    expect(result.host).toBe('http://env-override:7777');
  });

  it('UCLI_CONFIG overrides config file path', () => {
    const altDir = makeTmpDir();
    try {
      const altPath = writeConfig(
        altDir,
        `
default_profile: alt
profiles:
  alt:
    host: http://alt-server:7777
`
      );
      const env = {
        XDG_CONFIG_HOME: tmpDir, // would not have config
        UCLI_CONFIG: altPath,
      };
      const result = resolveConfig({}, env);
      expect(result.host).toBe('http://alt-server:7777');
    } finally {
      rmSync(altDir, { recursive: true, force: true });
    }
  });

  it('selects profile by UCLI_PROFILE env var', () => {
    const configDir = join(tmpDir, 'ucli');
    mkdirSync(configDir, { recursive: true });
    writeFileSync(
      join(configDir, 'config.yaml'),
      `
profiles:
  home:
    host: http://tower:7777
  work:
    host: http://workserver:7777
`
    );
    const env = {
      XDG_CONFIG_HOME: tmpDir,
      UCLI_PROFILE: 'work',
    };
    const result = resolveConfig({}, env);
    expect(result.host).toBe('http://workserver:7777');
    expect(result.profile).toBe('work');
  });

  it('reads api_key from config profiles', () => {
    const configDir = join(tmpDir, 'ucli');
    mkdirSync(configDir, { recursive: true });
    writeFileSync(
      join(configDir, 'config.yaml'),
      `
default_profile: tower
profiles:
  tower:
    host: http://tower:7777
    api_key: snake-key
`
    );
    const env = { XDG_CONFIG_HOME: tmpDir };
    const result = resolveConfig({}, env);
    expect(result.host).toBe('http://tower:7777');
    expect(result.apiKey).toBe('snake-key');
    expect(result.profile).toBe('tower');
  });
});
