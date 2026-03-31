import type { Command } from 'commander';
import { DEFAULTS, OUTPUT_FORMATS, resolveGlobalOptions, type GlobalOptions } from '../../cli/globals.js';
import { resolveAuth } from '../../core/auth/resolver.js';
import { resolveConfig } from '../../core/config/loader.js';
import { NotFoundError } from '../../core/errors/index.js';
import { paginate } from '../../core/filters/index.js';
import { createClient, type UcliGraphQLClient } from '../../core/graphql/client.js';
import { renderOutput } from '../../core/output/renderer.js';
import {
  ASSIGNABLE_DISKS_QUERY,
  DISK_CLEAR_STATS_MUTATION,
  DISK_MOUNT_MUTATION,
  DISK_QUERY,
  DISK_UNMOUNT_MUTATION,
  DISKS_QUERY,
  type ArrayDiskMutation,
  type AssignableDisksQuery,
  type DiskMutationVariables,
  type DiskQuery,
  type DiskQueryVariables,
  type DisksQuery,
} from '../../generated/disks.js';

export interface DisksCommandDependencies {
  createGraphQLClient: typeof createClient;
  stdoutWrite: (chunk: string) => boolean;
}

export interface DiskWriteResult {
  action: 'mount' | 'unmount' | 'clear-stats';
  name: string;
  success: boolean;
  message: string | null;
}

export const defaultDisksCommandDependencies: DisksCommandDependencies = {
  createGraphQLClient: createClient,
  stdoutWrite: (chunk: string) => process.stdout.write(chunk),
};

function toGraphQLEndpoint(host: string): string {
  return host.endsWith('/graphql') ? host : `${host.replace(/\/$/, '')}/graphql`;
}

function createDisksClient(
  options: GlobalOptions,
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): UcliGraphQLClient {
  const resolvedConfig = resolveConfig(options);
  const auth = resolveAuth({
    host: options.host ?? resolvedConfig.host,
    apiKey: options.apiKey ?? resolvedConfig.apiKey,
    profile: options.profile ?? resolvedConfig.profile,
  });

  return dependencies.createGraphQLClient({
    endpoint: toGraphQLEndpoint(auth.host),
    apiKey: auth.apiKey,
    timeout: options.timeout * 1000,
    debug: options.debug,
  });
}

export async function fetchDisks(
  options: GlobalOptions,
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): Promise<DisksQuery> {
  return createDisksClient(options, dependencies).execute<DisksQuery>(DISKS_QUERY);
}

export async function fetchDisk(
  name: string,
  options: GlobalOptions,
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): Promise<NonNullable<DiskQuery['disk']>> {
  const data = await createDisksClient(options, dependencies).execute<DiskQuery, DiskQueryVariables>(DISK_QUERY, { name });

  if (data.disk == null) {
    throw new NotFoundError(`Disk not found: ${name}`);
  }

  return data.disk;
}

export async function fetchAssignableDisks(
  options: GlobalOptions,
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): Promise<AssignableDisksQuery> {
  return createDisksClient(options, dependencies).execute<AssignableDisksQuery>(ASSIGNABLE_DISKS_QUERY);
}

export async function mountDisk(
  name: string,
  options: GlobalOptions,
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): Promise<ArrayDiskMutation> {
  return createDisksClient(options, dependencies).execute<ArrayDiskMutation, DiskMutationVariables>(DISK_MOUNT_MUTATION, { name });
}

export async function unmountDisk(
  name: string,
  options: GlobalOptions,
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): Promise<ArrayDiskMutation> {
  return createDisksClient(options, dependencies).execute<ArrayDiskMutation, DiskMutationVariables>(
    DISK_UNMOUNT_MUTATION,
    { name },
  );
}

export async function clearDiskStats(
  name: string,
  options: GlobalOptions,
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): Promise<ArrayDiskMutation> {
  return createDisksClient(options, dependencies).execute<ArrayDiskMutation, DiskMutationVariables>(
    DISK_CLEAR_STATS_MUTATION,
    { name },
  );
}

export function writeRenderedOutput(
  data: unknown,
  options: GlobalOptions,
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): void {
  dependencies.stdoutWrite(
    renderOutput(data, {
      format: options.output,
      fields: options.fields,
      noColor: options.noColor,
      quiet: options.quiet,
      verbose: options.verbose,
      stdoutIsTTY: process.stdout.isTTY,
    }),
  );
}

export function applyDisksCommandOptions(command: Command): Command {
  return command
    .option('--host <url>', 'Unraid server URL')
    .option('--api-key <key>', 'API key for authentication')
    .option('--profile <name>', 'Configuration profile to use')
    .option('-o, --output <format>', `Output format (${OUTPUT_FORMATS.join(', ')})`, DEFAULTS.output)
    .option('--fields <fields>', 'Comma-separated list of fields to include')
    .option('--timeout <seconds>', 'Request timeout in seconds', Number.parseInt, DEFAULTS.timeout)
    .option('--debug', 'Enable debug output on stderr')
    .option('-v, --verbose', 'Enable verbose output')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--force', 'Allow destructive operations (with --yes for S3)')
    .option('--no-color', 'Disable colored output');
}

export function applyDisksListOptions(command: Command): Command {
  return applyDisksCommandOptions(command)
    .option('--filter <expr>', 'Filter expression (e.g. status=healthy)')
    .option('--sort <expr>', 'Sort expression (e.g. name:asc)')
    .option('--page <number>', 'Page number for paginated results', Number.parseInt)
    .option('--page-size <number>', 'Items per page', Number.parseInt)
    .option('--all', 'Fetch all pages (disable pagination)');
}

export function resolveDisksOptions(command: Command): GlobalOptions {
  const parentOptions = command.parent?.optsWithGlobals() ?? {};
  const localOptions = command.opts();
  return resolveGlobalOptions({ ...parentOptions, ...localOptions });
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) {
    return 'unknown';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(unitIndex > 0 ? 2 : 0)} ${units[unitIndex]}`;
}

export function formatTemperature(value: number | null | undefined): string {
  return value == null ? 'unknown' : `${value}C`;
}

export function getTemperatureSeverity(value: number | null | undefined): 'normal' | 'warning' | 'critical' | 'unknown' {
  if (value == null) {
    return 'unknown';
  }

  if (value > 50) {
    return 'critical';
  }

  if (value >= 40) {
    return 'warning';
  }

  return 'normal';
}

export function paginateItems<T>(items: readonly T[], options: GlobalOptions): T[] {
  return paginate(items, {
    page: options.page,
    pageSize: options.pageSize,
    all: options.all,
  }).items;
}

export function usagePercent(used: number | null | undefined, size: number | null | undefined): number | null {
  if (used == null || size == null || size <= 0) {
    return null;
  }

  return Number(((used / size) * 100).toFixed(1));
}
