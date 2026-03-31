/**
 * Config schema definition and validation for ucli.
 */

import type { OutputFormat } from '../../cli/globals.js';
import { OUTPUT_FORMATS } from '../../cli/globals.js';

/** A single named profile */
export interface ProfileConfig {
  host?: string;
  apiKey?: string;
  output?: OutputFormat;
  timeout?: number;
}

/** Root config shape as stored in config.yaml */
export interface UcliConfig {
  default_profile?: string;
  profiles?: Record<string, ProfileConfig>;
}

interface RawProfileConfig extends Record<string, unknown> {
  host?: unknown;
  apiKey?: unknown;
  api_key?: unknown;
  output?: unknown;
  timeout?: unknown;
}

/** Resolved config after all sources are merged */
export interface ResolvedConfig {
  host?: string;
  apiKey?: string;
  output: OutputFormat;
  timeout: number;
  profile?: string;
}

/** Validation error for invalid config */
export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Validates a parsed config object. Throws ConfigValidationError on invalid data.
 * Returns the typed config or throws.
 */
export function validateConfig(raw: unknown): UcliConfig {
  if (raw === null || raw === undefined) {
    return {};
  }

  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ConfigValidationError('Config must be a YAML mapping, got ' + typeof raw);
  }

  const obj = raw as Record<string, unknown>;
  const normalized: UcliConfig = {};

  if ('default_profile' in obj && obj['default_profile'] !== undefined) {
    if (typeof obj['default_profile'] !== 'string') {
      throw new ConfigValidationError('default_profile must be a string');
    }
    normalized.default_profile = obj['default_profile'];
  }

  if ('profiles' in obj && obj['profiles'] !== undefined) {
    if (typeof obj['profiles'] !== 'object' || Array.isArray(obj['profiles'])) {
      throw new ConfigValidationError('profiles must be a YAML mapping');
    }

    const profiles = obj['profiles'] as Record<string, unknown>;
    const normalizedProfiles: Record<string, ProfileConfig> = {};

    for (const [name, profile] of Object.entries(profiles)) {
      if (typeof profile !== 'object' || Array.isArray(profile) || profile === null) {
        throw new ConfigValidationError(`profiles.${name} must be a mapping`);
      }

      const p = profile as RawProfileConfig;
      const normalizedProfile: ProfileConfig = {};

      if ('host' in p && p.host !== undefined) {
        if (typeof p.host !== 'string') {
          throw new ConfigValidationError(`profiles.${name}.host must be a string`);
        }
        normalizedProfile.host = p.host;
      }

      const rawApiKey = p.apiKey ?? p.api_key;
      if (rawApiKey !== undefined) {
        if (typeof rawApiKey !== 'string') {
          throw new ConfigValidationError(`profiles.${name}.apiKey must be a string`);
        }
        normalizedProfile.apiKey = rawApiKey;
      }

      if ('output' in p && p.output !== undefined) {
        if (!OUTPUT_FORMATS.includes(p.output as OutputFormat)) {
          throw new ConfigValidationError(
            `profiles.${name}.output must be one of: ${OUTPUT_FORMATS.join(', ')}`
          );
        }
        normalizedProfile.output = p.output as OutputFormat;
      }

      if ('timeout' in p && p.timeout !== undefined) {
        if (typeof p.timeout !== 'number' || p.timeout <= 0) {
          throw new ConfigValidationError(`profiles.${name}.timeout must be a positive number`);
        }
        normalizedProfile.timeout = p.timeout;
      }

      normalizedProfiles[name] = normalizedProfile;
    }

    normalized.profiles = normalizedProfiles;
  }

  return normalized;
}
