/**
 * Global CLI options shared across all commands.
 *
 * These flags are registered at the program level and inherited by every subcommand.
 */

/** Supported output formats */
export type OutputFormat = 'human' | 'json' | 'yaml' | 'table';

/** All valid output format values for validation */
export const OUTPUT_FORMATS: readonly OutputFormat[] = ['human', 'json', 'yaml', 'table'] as const;

/** Default values for global options */
export const DEFAULTS = {
  output: 'human' as OutputFormat,
  timeout: 30,
  retry: 3,
  pageSize: 25,
} as const;

/**
 * Type-safe interface for all global CLI options.
 *
 * These correspond 1:1 with the Commander option flags registered in cli/index.ts.
 */
export interface GlobalOptions {
  /** Unraid server URL (e.g. http://192.168.1.10:7777) */
  host?: string;

  /** API key for authentication */
  apiKey?: string;

  /** Configuration profile name */
  profile?: string;

  /** Output format */
  output: OutputFormat;

  /** Comma-separated list of fields to include in output */
  fields?: string;

  /** Filter expression (e.g. "status=running") */
  filter?: string;

  /** Sort expression (e.g. "name:asc") */
  sort?: string;

  /** Page number for paginated results */
  page?: number;

  /** Number of items per page */
  pageSize?: number;

  /** Fetch all pages (disable pagination) */
  all?: boolean;

  /** Request timeout in seconds */
  timeout: number;

  /** Max retry attempts for read operations */
  retry: number;

  /** Enable debug output on stderr */
  debug?: boolean;

  /** Enable verbose output */
  verbose?: boolean;

  /** Suppress non-essential output */
  quiet?: boolean;

  /** Skip confirmation prompts (auto-accept) */
  yes?: boolean;

  /** Allow destructive operations (used with --yes for S3) */
  force?: boolean;

  /** Disable colored output */
  noColor?: boolean;
}

/**
 * Extract GlobalOptions from a Commander options object.
 *
 * Commander stores parsed options with camelCase keys, so this function
 * provides a typed extraction layer.
 */
export function resolveGlobalOptions(raw: Record<string, unknown>): GlobalOptions {
  return {
    host: raw['host'] as string | undefined,
    apiKey: raw['apiKey'] as string | undefined,
    profile: raw['profile'] as string | undefined,
    output: validateOutputFormat(raw['output'] as string | undefined),
    fields: raw['fields'] as string | undefined,
    filter: raw['filter'] as string | undefined,
    sort: raw['sort'] as string | undefined,
    page: raw['page'] != null ? Number(raw['page']) : undefined,
    pageSize: raw['pageSize'] != null ? Number(raw['pageSize']) : undefined,
    all: raw['all'] as boolean | undefined,
    timeout: raw['timeout'] != null ? Number(raw['timeout']) : DEFAULTS.timeout,
    retry: raw['retry'] != null ? Number(raw['retry']) : DEFAULTS.retry,
    debug: raw['debug'] as boolean | undefined,
    verbose: raw['verbose'] as boolean | undefined,
    quiet: raw['quiet'] as boolean | undefined,
    yes: raw['yes'] as boolean | undefined,
    force: raw['force'] as boolean | undefined,
    noColor: raw['noColor'] as boolean | undefined,
  };
}

/**
 * Validate and return a valid OutputFormat, falling back to default.
 */
function validateOutputFormat(value: string | undefined): OutputFormat {
  if (value && OUTPUT_FORMATS.includes(value as OutputFormat)) {
    return value as OutputFormat;
  }
  return DEFAULTS.output;
}
