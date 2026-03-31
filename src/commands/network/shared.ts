import type { Command } from 'commander';
import { DEFAULTS, OUTPUT_FORMATS, resolveGlobalOptions, type GlobalOptions } from '../../cli/globals.js';
import { resolveAuth } from '../../core/auth/resolver.js';
import { resolveConfig } from '../../core/config/loader.js';
import { NotFoundError } from '../../core/errors/index.js';
import { paginate } from '../../core/filters/index.js';
import { createClient, type UcliGraphQLClient } from '../../core/graphql/client.js';
import { renderOutput } from '../../core/output/renderer.js';
import { NETWORK_QUERY, type NetworkInterfaceRecord, type NetworkQuery } from '../../generated/network.js';

export interface NetworkCommandDependencies {
  createGraphQLClient: typeof createClient;
  stdoutWrite: (chunk: string) => boolean;
}

export const defaultNetworkCommandDependencies: NetworkCommandDependencies = {
  createGraphQLClient: createClient,
  stdoutWrite: (chunk: string) => process.stdout.write(chunk),
};

function toGraphQLEndpoint(host: string): string {
  return host.endsWith('/graphql') ? host : `${host.replace(/\/$/, '')}/graphql`;
}

function createNetworkClient(options: GlobalOptions, dependencies: NetworkCommandDependencies = defaultNetworkCommandDependencies): UcliGraphQLClient {
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

export async function fetchNetwork(
  options: GlobalOptions,
  dependencies: NetworkCommandDependencies = defaultNetworkCommandDependencies,
): Promise<NetworkQuery> {
  return createNetworkClient(options, dependencies).execute<NetworkQuery>(NETWORK_QUERY);
}

export async function fetchInterfaceByName(
  name: string,
  options: GlobalOptions,
  dependencies: NetworkCommandDependencies = defaultNetworkCommandDependencies,
): Promise<NetworkInterfaceRecord> {
  const snapshot = await fetchNetwork(options, dependencies);
  const match = snapshot.info.networkInterfaces.find((iface) => iface.name === name);

  if (match == null) throw new NotFoundError(`Network interface not found: ${name}`);
  return match;
}

export function writeRenderedOutput(data: unknown, options: GlobalOptions, dependencies: NetworkCommandDependencies = defaultNetworkCommandDependencies): void {
  dependencies.stdoutWrite(renderOutput(data, {
    format: options.output,
    fields: options.fields,
    noColor: options.noColor,
    quiet: options.quiet,
    verbose: options.verbose,
    stdoutIsTTY: process.stdout.isTTY,
  }));
}

export function applyNetworkCommandOptions(command: Command): Command {
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

export function applyNetworkListOptions(command: Command): Command {
  return applyNetworkCommandOptions(command)
    .option('--filter <expr>', 'Filter expression (e.g. status=up)')
    .option('--sort <expr>', 'Sort expression (e.g. name:asc)')
    .option('--page <number>', 'Page number for paginated results', Number.parseInt)
    .option('--page-size <number>', 'Items per page', Number.parseInt)
    .option('--all', 'Fetch all pages (disable pagination)');
}

export function resolveNetworkOptions(command: Command): GlobalOptions {
  const parentOptions = command.parent?.optsWithGlobals() ?? {};
  const localOptions = command.opts();
  return resolveGlobalOptions({ ...parentOptions, ...localOptions });
}

export function paginateItems<T>(items: readonly T[], options: GlobalOptions): T[] {
  return paginate(items, { page: options.page, pageSize: options.pageSize, all: options.all }).items;
}
