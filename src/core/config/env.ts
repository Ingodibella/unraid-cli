/**
 * Environment variable reader for ucli config.
 *
 * Reads UCLI_HOST, UCLI_API_KEY, UCLI_PROFILE, UCLI_CONFIG from process.env.
 */

export interface EnvConfig {
  host?: string;
  apiKey?: string;
  profile?: string;
  configPath?: string;
}

/**
 * Read ucli-relevant env vars from the given env object (defaults to process.env).
 */
export function readEnvConfig(env: Record<string, string | undefined> = process.env): EnvConfig {
  const result: EnvConfig = {};

  if (env['UCLI_HOST']) {
    result.host = env['UCLI_HOST'];
  }

  if (env['UCLI_API_KEY']) {
    result.apiKey = env['UCLI_API_KEY'];
  }

  if (env['UCLI_PROFILE']) {
    result.profile = env['UCLI_PROFILE'];
  }

  if (env['UCLI_CONFIG']) {
    result.configPath = env['UCLI_CONFIG'];
  }

  return result;
}
