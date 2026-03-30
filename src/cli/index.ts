#!/usr/bin/env node

/**
 * ucli: The serious CLI for serious Unraid operators.
 *
 * Main entry point. Creates the Commander program with all global flags.
 */

import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { DEFAULTS, OUTPUT_FORMATS } from './globals.js';

/** Parse an integer from string (ignores Commander's second arg to avoid radix issues) */
function parseIntSafe(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Expected a number, got "${value}"`);
  }
  return parsed;
}

/**
 * Read the version from package.json at build time.
 */
function getVersion(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = dirname(currentFile);

  // Walk up to find package.json (works from both src/ and dist/)
  const candidates = [
    resolve(currentDir, '../../package.json'),   // from dist/cli/ or src/cli/
    resolve(currentDir, '../../../package.json'), // fallback deeper nesting
  ];

  for (const candidate of candidates) {
    try {
      const content = readFileSync(candidate, 'utf-8');
      const pkg: { version?: string } = JSON.parse(content) as { version?: string };
      if (pkg.version) return pkg.version;
    } catch {
      // Try next candidate
    }
  }

  return '0.0.0-unknown';
}

/**
 * Create and configure the main CLI program.
 *
 * This is exported as a factory so tests can create isolated program instances.
 */
export function createProgram(): Command {
  const version = getVersion();

  const program = new Command('ucli')
    .version(version, '-V, --version', 'Show version number')
    .description('The serious CLI for serious Unraid operators.')
    .enablePositionalOptions()
    .passThroughOptions();

  // Connection options
  program.option('--host <url>', 'Unraid server URL (e.g. http://192.168.1.10:7777)');
  program.option('--api-key <key>', 'API key for authentication');
  program.option('--profile <name>', 'Configuration profile to use');

  // Output options
  program.option(
    '-o, --output <format>',
    `Output format (${OUTPUT_FORMATS.join(', ')})`,
    DEFAULTS.output,
  );
  program.option('--fields <fields>', 'Comma-separated list of fields to include');
  program.option('--filter <expr>', 'Filter expression (e.g. status=running)');
  program.option('--sort <expr>', 'Sort expression (e.g. name:asc)');

  // Pagination options
  program.option('--page <number>', 'Page number for paginated results', parseIntSafe);
  program.option('--page-size <number>', 'Items per page', parseIntSafe);
  program.option('--all', 'Fetch all pages (disable pagination)');

  // Behavior options
  program.option('--timeout <seconds>', 'Request timeout in seconds', parseIntSafe, DEFAULTS.timeout);
  program.option('--retry <count>', 'Max retry attempts for read operations', parseIntSafe, DEFAULTS.retry);

  // Verbosity options
  program.option('--debug', 'Enable debug output on stderr');
  program.option('-v, --verbose', 'Enable verbose output');
  program.option('-q, --quiet', 'Suppress non-essential output');

  // Safety options
  program.option('-y, --yes', 'Skip confirmation prompts');
  program.option('--force', 'Allow destructive operations (with --yes for S3)');

  // Display options
  program.option('--no-color', 'Disable colored output');

  return program;
}

/**
 * Main entry point. Parses argv and runs the matched command.
 */
export async function main(argv?: string[]): Promise<void> {
  const program = createProgram();
  await program.parseAsync(argv ?? process.argv);
}

// Only run main() when executed directly, not when imported
const currentFile = fileURLToPath(import.meta.url);
const isDirectRun = process.argv[1] === currentFile
  || process.argv[1]?.endsWith('/dist/cli/index.js')
  || process.argv[1]?.endsWith('/src/cli/index.ts');

if (isDirectRun) {
  main().catch((err: unknown) => {
    process.stderr.write(`Fatal: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
}
