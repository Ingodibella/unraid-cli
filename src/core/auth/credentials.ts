/**
 * Credential storage for ucli.
 *
 * Credentials live in ~/.config/ucli/credentials.yaml (or XDG equivalent).
 * The file is created with 0600 permissions on write.
 *
 * Format:
 *   profiles:
 *     home:
 *       api_key: "the-key"
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

/** Shape of one credential entry */
export interface CredentialEntry {
  api_key: string;
}

/** Root shape of credentials.yaml */
export interface CredentialsFile {
  profiles?: Record<string, CredentialEntry>;
}

/** Error thrown when credential file is invalid */
export class CredentialsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CredentialsError';
  }
}

/**
 * Returns the XDG config home directory.
 */
function getXdgConfigHome(env: Record<string, string | undefined> = process.env): string {
  return env['XDG_CONFIG_HOME'] ?? join(homedir(), '.config');
}

/**
 * Returns the default credentials file path.
 */
export function getDefaultCredentialsPath(
  env: Record<string, string | undefined> = process.env
): string {
  return join(getXdgConfigHome(env), 'ucli', 'credentials.yaml');
}

/**
 * Reads and parses the credentials file at the given path.
 * Returns an empty credentials object if the file does not exist.
 */
export function readCredentials(
  credentialsPath: string
): CredentialsFile {
  if (!existsSync(credentialsPath)) {
    return {};
  }

  let content: string;
  try {
    content = readFileSync(credentialsPath, 'utf-8');
  } catch (err) {
    throw new CredentialsError(
      `Cannot read credentials file at ${credentialsPath}: ${(err as Error).message}`
    );
  }

  let parsed: unknown;
  try {
    parsed = parseYaml(content);
  } catch (err) {
    throw new CredentialsError(
      `Credentials file at ${credentialsPath} is not valid YAML: ${(err as Error).message}`
    );
  }

  if (parsed === null || parsed === undefined) {
    return {};
  }

  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new CredentialsError('Credentials file must be a YAML mapping');
  }

  return parsed as CredentialsFile;
}

/**
 * Writes credentials to the given path.
 * Creates parent directories if needed.
 * Sets file permissions to 0600.
 */
export function writeCredentials(
  credentialsPath: string,
  credentials: CredentialsFile
): void {
  const dir = dirname(credentialsPath);
  mkdirSync(dir, { recursive: true });

  const content = stringifyYaml(credentials);
  writeFileSync(credentialsPath, content, { encoding: 'utf-8', mode: 0o600 });

  // Explicitly chmod in case the file already existed with different permissions
  chmodSync(credentialsPath, 0o600);
}

/**
 * Gets the API key for a named profile from the credentials file.
 * Returns undefined if the profile or api_key is not found.
 */
export function getProfileApiKey(
  credentials: CredentialsFile,
  profileName: string
): string | undefined {
  return credentials.profiles?.[profileName]?.api_key;
}

/**
 * Sets the API key for a named profile in the credentials object.
 * Mutates and returns the credentials object.
 */
export function setProfileApiKey(
  credentials: CredentialsFile,
  profileName: string,
  apiKey: string
): CredentialsFile {
  const updated: CredentialsFile = {
    ...credentials,
    profiles: {
      ...(credentials.profiles ?? {}),
      [profileName]: {
        ...(credentials.profiles?.[profileName] ?? {}),
        api_key: apiKey,
      },
    },
  };
  return updated;
}
