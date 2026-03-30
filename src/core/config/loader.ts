/**
 * Config loader for ucli.
 *
 * Loads YAML config from XDG-compliant path and merges all sources:
 * CLI flags > env vars > active profile > default profile > built-in defaults.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { parse as parseYaml } from 'yaml';
import type { GlobalOptions, OutputFormat } from '../../cli/globals.js';
import { DEFAULTS } from '../../cli/globals.js';
import { validateConfig, ConfigValidationError, type ResolvedConfig } from './schema.js';
import { readEnvConfig, type EnvConfig } from './env.js';
import { resolveProfile } from './profiles.js';

/** Built-in defaults for resolved config */
const CONFIG_DEFAULTS: ResolvedConfig = {
  output: DEFAULTS.output,
  timeout: DEFAULTS.timeout,
};

/**
 * Returns the XDG config home directory.
 * Respects XDG_CONFIG_HOME env var, falls back to ~/.config.
 */
export function getXdgConfigHome(env: Record<string, string | undefined> = process.env): string {
  return env['XDG_CONFIG_HOME'] ?? join(homedir(), '.config');
}

/**
 * Returns the default config file path.
 */
export function getDefaultConfigPath(env: Record<string, string | undefined> = process.env): string {
  return join(getXdgConfigHome(env), 'ucli', 'config.yaml');
}

/**
 * Loads and parses the YAML config file at the given path.
 * Returns empty config if file does not exist.
 * Throws ConfigValidationError with exit-code 2 semantics if file is invalid.
 */
export function loadConfigFile(
  configPath: string
): ReturnType<typeof validateConfig> {
  if (!existsSync(configPath)) {
    return {};
  }

  let content: string;
  try {
    content = readFileSync(configPath, 'utf-8');
  } catch (err) {
    throw new ConfigValidationError(
      `Cannot read config file at ${configPath}: ${(err as Error).message}`
    );
  }

  let parsed: unknown;
  try {
    parsed = parseYaml(content);
  } catch (err) {
    throw new ConfigValidationError(
      `Config file at ${configPath} is not valid YAML: ${(err as Error).message}`
    );
  }

  return validateConfig(parsed);
}

/** Flags subset relevant for config resolution */
export interface ConfigFlags {
  host?: string;
  apiKey?: string;
  profile?: string;
  output?: OutputFormat;
  timeout?: number;
}

/**
 * Resolves the final config by merging all sources.
 *
 * Order: CLI flags > env vars > active profile > default profile > built-in defaults.
 */
export function resolveConfig(
  flags: Partial<ConfigFlags> = {},
  env: Record<string, string | undefined> = process.env
): ResolvedConfig {
  const envConfig: EnvConfig = readEnvConfig(env);

  // Determine config file path
  const configPath = envConfig.configPath ?? getDefaultConfigPath(env);
  const fileConfig = loadConfigFile(configPath);

  // Determine active profile name
  const profileName = flags.profile ?? envConfig.profile;

  // Resolve active profile
  const activeProfile = resolveProfile(fileConfig, profileName);

  // Merge: flags > env > active profile > defaults
  const resolved: ResolvedConfig = {
    host: flags.host ?? envConfig.host ?? activeProfile?.host ?? CONFIG_DEFAULTS.host,
    apiKey: flags.apiKey ?? envConfig.apiKey ?? activeProfile?.apiKey ?? CONFIG_DEFAULTS.apiKey,
    output:
      flags.output ??
      (activeProfile?.output) ??
      CONFIG_DEFAULTS.output,
    timeout:
      flags.timeout ??
      activeProfile?.timeout ??
      CONFIG_DEFAULTS.timeout,
    profile: profileName,
  };

  return resolved;
}

export { ConfigValidationError };
export type { GlobalOptions };
