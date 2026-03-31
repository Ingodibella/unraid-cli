import type { Command } from 'commander';
import { DEFAULTS, OUTPUT_FORMATS, resolveGlobalOptions, type GlobalOptions } from '../../cli/globals.js';
import { resolveAuth } from '../../core/auth/resolver.js';
import { resolveConfig } from '../../core/config/loader.js';
import { createClient, type UcliGraphQLClient } from '../../core/graphql/client.js';
import { renderOutput } from '../../core/output/renderer.js';
import {
  ARRAY_QUERY,
  PARITY_HISTORY_QUERY,
  type ArrayQuery,
  type ParityHistoryQuery,
} from '../../generated/array.js';

export interface ArrayCommandDependencies {
  createGraphQLClient: typeof createClient;
  stdoutWrite: (chunk: string) => boolean;
}

export const defaultArrayCommandDependencies: ArrayCommandDependencies = {
  createGraphQLClient: createClient,
  stdoutWrite: (chunk: string) => process.stdout.write(chunk),
};

function toGraphQLEndpoint(host: string): string {
  return host.endsWith('/graphql') ? host : `${host.replace(/\/$/, '')}/graphql`;
}

export async function fetchArray(
  options: GlobalOptions,
  dependencies: ArrayCommandDependencies = defaultArrayCommandDependencies,
): Promise<ArrayQuery> {
  const resolvedConfig = resolveConfig(options);
  const auth = resolveAuth({
    host: options.host ?? resolvedConfig.host,
    apiKey: options.apiKey ?? resolvedConfig.apiKey,
    profile: options.profile ?? resolvedConfig.profile,
  });

  const client = dependencies.createGraphQLClient({
    endpoint: toGraphQLEndpoint(auth.host),
    apiKey: auth.apiKey,
    timeout: options.timeout * 1000,
    debug: options.debug,
  });

  return executeArrayQuery(client);
}

export async function fetchParityHistory(
  options: GlobalOptions,
  dependencies: ArrayCommandDependencies = defaultArrayCommandDependencies,
): Promise<ParityHistoryQuery> {
  const resolvedConfig = resolveConfig(options);
  const auth = resolveAuth({
    host: options.host ?? resolvedConfig.host,
    apiKey: options.apiKey ?? resolvedConfig.apiKey,
    profile: options.profile ?? resolvedConfig.profile,
  });

  const client = dependencies.createGraphQLClient({
    endpoint: toGraphQLEndpoint(auth.host),
    apiKey: auth.apiKey,
    timeout: options.timeout * 1000,
    debug: options.debug,
  });

  return executeParityHistoryQuery(client);
}

export async function executeArrayQuery(client: UcliGraphQLClient): Promise<ArrayQuery> {
  return client.execute<ArrayQuery>(ARRAY_QUERY);
}

export async function executeParityHistoryQuery(client: UcliGraphQLClient): Promise<ParityHistoryQuery> {
  return client.execute<ParityHistoryQuery>(PARITY_HISTORY_QUERY);
}

export function writeRenderedOutput(
  data: unknown,
  options: GlobalOptions,
  dependencies: ArrayCommandDependencies = defaultArrayCommandDependencies,
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

export function applyArrayCommandOptions(command: Command): Command {
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
    .option('--no-color', 'Disable colored output');
}

export function applyArrayDevicesOptions(command: Command): Command {
  return applyArrayCommandOptions(command)
    .option('--filter <expr>', 'Filter expression (e.g. status=healthy)')
    .option('--sort <expr>', 'Sort expression (e.g. name:asc)');
}

export function resolveArrayOptions(command: Command): GlobalOptions {
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

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) {
    return 'unknown';
  }

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);

  return parts.join(' ');
}
