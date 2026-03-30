/**
 * Auth resolver for ucli.
 *
 * Resolves credentials in priority order:
 *   1. --api-key flag
 *   2. UCLI_API_KEY env var
 *   3. Profile credentials from credentials.yaml
 *
 * Returns { host: string, apiKey: string } or throws AuthError (exit code 3).
 */

import { getDefaultCredentialsPath, readCredentials, getProfileApiKey } from './credentials.js';
import { isValidApiKey, normalizeApiKey } from './api-key.js';
import { AuthError } from '../errors/graphql-errors.js';

export { AuthError } from '../errors/graphql-errors.js';

/** Resolved auth context returned by resolveAuth */
export interface ResolvedAuth {
  host: string;
  apiKey: string;
}

/** Flags relevant to auth resolution */
export interface AuthFlags {
  apiKey?: string;
  host?: string;
  profile?: string;
}

/** Options for resolveAuth - allows injecting env and credentials path for testing */
export interface ResolveAuthOptions {
  env?: Record<string, string | undefined>;
  credentialsPath?: string;
}

/**
 * Resolves auth credentials from all available sources.
 *
 * Priority: --api-key flag > UCLI_API_KEY env var > profile credentials
 *
 * Throws AuthError (exit code 3) if no valid credentials are found,
 * or if the host cannot be determined.
 */
export function resolveAuth(
  flags: Partial<AuthFlags> = {},
  options: ResolveAuthOptions = {}
): ResolvedAuth {
  const env = options.env ?? process.env;

  // Resolve host from flag, env, or error
  const host = flags.host ?? env['UCLI_HOST'];
  if (!host || host.trim().length === 0) {
    throw new AuthError(
      'No Unraid host configured. Set --host, UCLI_HOST, or run: ucli auth login'
    );
  }

  // 1. --api-key flag
  if (flags.apiKey !== undefined) {
    if (!isValidApiKey(flags.apiKey)) {
      throw new AuthError(
        'Provided --api-key is empty or invalid. Run: ucli auth login'
      );
    }
    return { host: host.trim(), apiKey: normalizeApiKey(flags.apiKey) };
  }

  // 2. UCLI_API_KEY env var
  const envApiKey = env['UCLI_API_KEY'];
  if (envApiKey !== undefined) {
    if (!isValidApiKey(envApiKey)) {
      throw new AuthError(
        'UCLI_API_KEY is set but empty or invalid. Run: ucli auth login'
      );
    }
    return { host: host.trim(), apiKey: normalizeApiKey(envApiKey) };
  }

  // 3. Profile credentials
  const credPath =
    options.credentialsPath ?? getDefaultCredentialsPath(env);
  const credentials = readCredentials(credPath);

  const profileName = flags.profile ?? env['UCLI_PROFILE'] ?? 'default';
  const profileApiKey = getProfileApiKey(credentials, profileName);

  if (!isValidApiKey(profileApiKey)) {
    throw new AuthError(
      `No API key found for profile "${profileName}". Run: ucli auth login`
    );
  }

  return { host: host.trim(), apiKey: normalizeApiKey(profileApiKey as string) };
}
