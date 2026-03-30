/**
 * Profile resolution for ucli config.
 */

import type { UcliConfig, ProfileConfig } from './schema.js';

/**
 * Resolves the active profile from config.
 * Priority: explicit profile name > default_profile > undefined.
 */
export function resolveProfile(
  config: UcliConfig,
  profileName?: string
): ProfileConfig | undefined {
  const name = profileName ?? config.default_profile;
  if (!name) return undefined;
  return config.profiles?.[name];
}

/**
 * List all profile names defined in config.
 */
export function listProfiles(config: UcliConfig): string[] {
  return Object.keys(config.profiles ?? {});
}
