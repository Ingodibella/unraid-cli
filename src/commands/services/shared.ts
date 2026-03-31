import type { Command } from 'commander';
import { DEFAULTS, OUTPUT_FORMATS, resolveGlobalOptions, type GlobalOptions } from '../../cli/globals.js';
import { resolveAuth } from '../../core/auth/resolver.js';
import { resolveConfig } from '../../core/config/loader.js';
import { NotFoundError } from '../../core/errors/index.js';
import { paginate } from '../../core/filters/index.js';
import { createClient, type UcliGraphQLClient } from '../../core/graphql/client.js';
import { renderOutput } from '../../core/output/renderer.js';
import { SERVICES_QUERY, type ServiceRecord, type ServicesQuery } from '../../generated/services.js';

export interface ServicesCommandDependencies {
  createGraphQLClient: typeof createClient;
  stdoutWrite: (chunk: string) => boolean;
}

export const defaultServicesCommandDependencies: ServicesCommandDependencies = {
  createGraphQLClient: createClient,
  stdoutWrite: (chunk: string) => process.stdout.write(chunk),
};

function toGraphQLEndpoint(host: string): string {
  return host.endsWith('/graphql') ? host : `${host.replace(/\/$/, '')}/graphql`;
}

function createServicesClient(options: GlobalOptions, dependencies: ServicesCommandDependencies = defaultServicesCommandDependencies): UcliGraphQLClient {
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

export async function fetchServices(
  options: GlobalOptions,
  dependencies: ServicesCommandDependencies = defaultServicesCommandDependencies,
): Promise<ServiceRecord[]> {
  const data = await createServicesClient(options, dependencies).execute<ServicesQuery>(SERVICES_QUERY);
  return data.services;
}

export async function fetchService(
  idOrName: string,
  options: GlobalOptions,
  dependencies: ServicesCommandDependencies = defaultServicesCommandDependencies,
): Promise<ServiceRecord> {
  const services = await fetchServices(options, dependencies);
  const service = services.find((entry) => entry.id === idOrName || entry.name === idOrName) ?? null;
  if (service == null) throw new NotFoundError(`Service not found: ${idOrName}`);
  return service;
}

export function writeRenderedOutput(data: unknown, options: GlobalOptions, dependencies: ServicesCommandDependencies = defaultServicesCommandDependencies): void {
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

export function applyServicesCommandOptions(command: Command): Command {
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

export function applyServicesListOptions(command: Command): Command {
  return applyServicesCommandOptions(command)
    .option('--filter <expr>', 'Filter expression (e.g. online=true)')
    .option('--sort <expr>', 'Sort expression (e.g. name:asc)')
    .option('--page <number>', 'Page number for paginated results', Number.parseInt)
    .option('--page-size <number>', 'Items per page', Number.parseInt)
    .option('--all', 'Fetch all pages (disable pagination)');
}

export function resolveServicesOptions(command: Command): GlobalOptions {
  const parentOptions = command.parent?.optsWithGlobals() ?? {};
  const localOptions = command.opts();
  return resolveGlobalOptions({ ...parentOptions, ...localOptions });
}

export function paginateItems<T>(items: readonly T[], options: GlobalOptions): T[] {
  return paginate(items, { page: options.page, pageSize: options.pageSize, all: options.all }).items;
}
