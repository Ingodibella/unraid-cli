import { Command } from 'commander';
import type { SchemaCommandDependencies } from './shared.js';
import {
  applySchemaCommandOptions,
  defaultSchemaCommandDependencies,
  exportSchema,
  fetchSchema,
  resolveSchemaOptions,
  writeRenderedOutput,
} from './shared.js';

export function createSchemaExportCommand(
  dependencies: SchemaCommandDependencies = defaultSchemaCommandDependencies,
): Command {
  return applySchemaCommandOptions(new Command('export'))
    .option('--format <format>', 'Schema export format (json|sdl)', 'json')
    .option('--file <path>', 'Write export to a file instead of stdout')
    .description('Export the live schema as JSON introspection or SDL')
    .action(async function handleSchemaExport() {
      const options = resolveSchemaOptions(this);
      const localOptions = this.opts<{ format: string; file?: string }>();
      const snapshot = await fetchSchema(options, dependencies);
      const format = localOptions.format === 'sdl' ? 'sdl' : 'json';
      const result = await exportSchema(snapshot, localOptions.file, format);
      writeRenderedOutput(result, options, dependencies);
    });
}
