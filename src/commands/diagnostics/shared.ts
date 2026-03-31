import type { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { DEFAULTS, OUTPUT_FORMATS, resolveGlobalOptions, type GlobalOptions } from '../../cli/globals.js';
import { resolveAuth } from '../../core/auth/resolver.js';
import { resolveConfig } from '../../core/config/loader.js';
import { createClient, type UcliGraphQLClient } from '../../core/graphql/client.js';
import { renderOutput } from '../../core/output/renderer.js';

export interface DiagnosticsCommandDependencies {
  createGraphQLClient: typeof createClient;
  now: () => number;
  readTextFile: (path: string) => string;
  stdoutWrite: (chunk: string) => boolean;
}

export const defaultDiagnosticsCommandDependencies: DiagnosticsCommandDependencies = {
  createGraphQLClient: createClient,
  now: () => Date.now(),
  readTextFile: (path: string) => readFileSync(path, 'utf8'),
  stdoutWrite: (chunk: string) => process.stdout.write(chunk),
};

export function applyDiagnosticsCommandOptions(command: Command): Command {
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

export function resolveDiagnosticsOptions(command: Command): GlobalOptions {
  const parentOptions = command.parent?.optsWithGlobals() ?? {};
  const localOptions = command.opts();
  return resolveGlobalOptions({ ...parentOptions, ...localOptions });
}

export function createDiagnosticsClient(
  options: GlobalOptions,
  dependencies: DiagnosticsCommandDependencies = defaultDiagnosticsCommandDependencies,
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

export function writeDiagnosticsOutput(
  data: unknown,
  options: GlobalOptions,
  dependencies: DiagnosticsCommandDependencies = defaultDiagnosticsCommandDependencies,
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

export function maskSecret(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  if (value.length <= 4) {
    return '*'.repeat(value.length);
  }

  return `${value.slice(0, 2)}${'*'.repeat(Math.max(4, value.length - 4))}${value.slice(-2)}`;
}

function toGraphQLEndpoint(host: string): string {
  return host.endsWith('/graphql') ? host : `${host.replace(/\/$/, '')}/graphql`;
}
