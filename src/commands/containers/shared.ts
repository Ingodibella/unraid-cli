import type { Command } from 'commander';
import { DEFAULTS, OUTPUT_FORMATS, resolveGlobalOptions, type GlobalOptions } from '../../cli/globals.js';
import { resolveAuth } from '../../core/auth/resolver.js';
import { resolveConfig } from '../../core/config/loader.js';
import { NotFoundError } from '../../core/errors/index.js';
import { paginate } from '../../core/filters/index.js';
import { createClient, type UcliGraphQLClient } from '../../core/graphql/client.js';
import { renderOutput } from '../../core/output/renderer.js';
import {
  DOCKER_SNAPSHOT_QUERY,
  type DockerContainerRecord,
  type DockerSnapshotQuery,
  type DockerWriteMutationVariables,
} from '../../generated/containers.js';

export interface ContainersCommandDependencies {
  createGraphQLClient: typeof createClient;
  stdoutWrite: (chunk: string) => boolean;
}

export const defaultContainersCommandDependencies: ContainersCommandDependencies = {
  createGraphQLClient: createClient,
  stdoutWrite: (chunk: string) => process.stdout.write(chunk),
};

function toGraphQLEndpoint(host: string): string {
  return host.endsWith('/graphql') ? host : `${host.replace(/\/$/, '')}/graphql`;
}

function createContainersClient(
  options: GlobalOptions,
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
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

export async function fetchDockerSnapshot(
  options: GlobalOptions,
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
): Promise<DockerSnapshotQuery> {
  return createContainersClient(options, dependencies).execute<DockerSnapshotQuery>(DOCKER_SNAPSHOT_QUERY);
}

export async function fetchContainer(
  identifier: string,
  options: GlobalOptions,
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
): Promise<DockerContainerRecord> {
  const snapshot = await fetchDockerSnapshot(options, dependencies);
  const normalizedIdentifier = normalizeContainerToken(identifier);
  const container = snapshot.docker.containers.find((entry) => (
    entry.id === identifier
    || entry.id === normalizedIdentifier
    || entry.names.some((name) => normalizeContainerToken(name) === normalizedIdentifier)
  ));

  if (container == null) {
    throw new NotFoundError(`Container not found: ${identifier}`);
  }

  return container;
}

export async function executeDockerMutation<TMutation>(
  query: string,
  id: string,
  options: GlobalOptions,
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
): Promise<TMutation> {
  return createContainersClient(options, dependencies).execute<TMutation, DockerWriteMutationVariables>(query, { id });
}

export function writeRenderedOutput(
  data: unknown,
  options: GlobalOptions,
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
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

export function applyContainersCommandOptions(command: Command): Command {
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

export function applyContainersListOptions(command: Command): Command {
  return applyContainersCommandOptions(command)
    .option('--filter <expr>', 'Filter expression (e.g. state=RUNNING)')
    .option('--sort <expr>', 'Sort expression (e.g. name:asc)')
    .option('--page <number>', 'Page number for paginated results', Number.parseInt)
    .option('--page-size <number>', 'Items per page', Number.parseInt)
    .option('--all', 'Fetch all pages (disable pagination)');
}

export function resolveContainersOptions(command: Command): GlobalOptions {
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

export function normalizeContainerToken(name: string | null | undefined): string {
  return (name ?? '').replace(/^\/+/, '').trim();
}

export function normalizeContainerName(names: string[] | string | null | undefined): string | null {
  if (Array.isArray(names)) {
    const normalized = names.map((name) => normalizeContainerToken(name)).filter((name) => name.length > 0);
    if (normalized.length === 0) {
      return null;
    }
    return normalized[0] ?? null;
  }

  const normalized = normalizeContainerToken(names);
  return normalized.length > 0 ? normalized : null;
}

export function formatContainerNames(names: string[] | null | undefined): string {
  const normalized = (names ?? [])
    .map((name) => normalizeContainerToken(name))
    .filter((name) => name.length > 0);
  return normalized.length > 0 ? normalized.join(', ') : 'unknown';
}

export function formatPorts(ports: DockerContainerRecord['ports']): string {
  if (ports.length === 0) {
    return 'none';
  }

  return ports.map((port) => {
    const target = port.privatePort == null ? 'unknown' : String(port.privatePort);
    const published = port.publicPort == null ? target : `${port.publicPort}->${target}`;
    return `${published}/${port.type}`;
  }).join(', ');
}
