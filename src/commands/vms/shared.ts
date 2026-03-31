import type { Command } from 'commander';
import { DEFAULTS, OUTPUT_FORMATS, resolveGlobalOptions, type GlobalOptions } from '../../cli/globals.js';
import { resolveAuth } from '../../core/auth/resolver.js';
import { resolveConfig } from '../../core/config/loader.js';
import { NotFoundError } from '../../core/errors/index.js';
import { paginate } from '../../core/filters/index.js';
import { createClient, type UcliGraphQLClient } from '../../core/graphql/client.js';
import { renderOutput } from '../../core/output/renderer.js';
import { assertSafety } from '../../core/safety/index.js';
import { VM_QUERY, VMS_QUERY, type VmQuery, type VmQueryVariables, type VmRecord, type VmsQuery } from '../../generated/vms.js';

export interface VmsCommandDependencies {
  createGraphQLClient: typeof createClient;
  stdoutWrite: (chunk: string) => boolean;
}

export const defaultVmsCommandDependencies: VmsCommandDependencies = {
  createGraphQLClient: createClient,
  stdoutWrite: (chunk: string) => process.stdout.write(chunk),
};

function toGraphQLEndpoint(host: string): string {
  return host.endsWith('/graphql') ? host : `${host.replace(/\/$/, '')}/graphql`;
}

function createVmsClient(
  options: GlobalOptions,
  dependencies: VmsCommandDependencies = defaultVmsCommandDependencies,
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

export async function fetchVms(
  options: GlobalOptions,
  dependencies: VmsCommandDependencies = defaultVmsCommandDependencies,
): Promise<VmsQuery> {
  return createVmsClient(options, dependencies).execute<VmsQuery>(VMS_QUERY);
}

export async function fetchVm(
  name: string,
  options: GlobalOptions,
  dependencies: VmsCommandDependencies = defaultVmsCommandDependencies,
): Promise<VmRecord> {
  const data = await createVmsClient(options, dependencies).execute<VmQuery, VmQueryVariables>(VM_QUERY, { name });
  const vm = data.vm;

  if (vm == null) {
    throw new NotFoundError(`VM not found: ${name}`);
  }

  return vm;
}

export interface VmWriteActionInput {
  action: 'start' | 'stop' | 'pause' | 'resume' | 'reboot' | 'reset' | 'force-stop';
  commandPath: string;
  mutation: string;
  name: string;
  options: GlobalOptions;
  dependencies?: VmsCommandDependencies;
}

export interface VmWriteActionOutput {
  action: string;
  name: string;
  status: string | null;
  state: string | null;
}

export async function executeVmWriteAction(input: VmWriteActionInput): Promise<VmWriteActionOutput> {
  const dependencies = input.dependencies ?? defaultVmsCommandDependencies;
  await assertSafety(input.commandPath, { yes: input.options.yes, force: input.options.force }, { stdout: process.stdout });

  await createVmsClient(input.options, dependencies).execute(input.mutation, { name: input.name });

  const vm = await fetchVm(input.name, input.options, dependencies);

  return {
    action: input.action,
    name: vm.name ?? input.name,
    status: vm.status,
    state: vm.state,
  };
}

export function writeRenderedOutput(
  data: unknown,
  options: GlobalOptions,
  dependencies: VmsCommandDependencies = defaultVmsCommandDependencies,
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

export function applyVmsCommandOptions(command: Command): Command {
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

export function applyVmsListOptions(command: Command): Command {
  return applyVmsCommandOptions(command)
    .option('--filter <expr>', 'Filter expression (e.g. status=running)')
    .option('--sort <expr>', 'Sort expression (e.g. name:asc)')
    .option('--page <number>', 'Page number for paginated results', Number.parseInt)
    .option('--page-size <number>', 'Items per page', Number.parseInt)
    .option('--all', 'Fetch all pages (disable pagination)');
}

export function resolveVmsOptions(command: Command): GlobalOptions {
  const parentOptions = command.parent?.optsWithGlobals() ?? {};
  const localOptions = command.opts();
  return resolveGlobalOptions({ ...parentOptions, ...localOptions });
}

export function paginateItems<T>(items: readonly T[], options: GlobalOptions): T[] {
  return paginate(items, {
    page: options.page,
    pageSize: options.pageSize,
    all: options.all,
  }).items;
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
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex > 0 ? 2 : 0)} ${units[unitIndex]}`;
}
