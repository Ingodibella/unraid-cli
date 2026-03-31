import { Command } from 'commander';
import type { SchemaCommandDependencies } from './shared.js';
import {
  applySchemaCommandOptions,
  defaultSchemaCommandDependencies,
  fetchSchema,
  resolveSchemaOptions,
  schemaInfo,
  writeRenderedOutput,
} from './shared.js';

export function createSchemaInfoCommand(
  dependencies: SchemaCommandDependencies = defaultSchemaCommandDependencies,
): Command {
  return applySchemaCommandOptions(new Command('info'))
    .description('Show schema summary and version')
    .action(async function handleSchemaInfo() {
      const options = resolveSchemaOptions(this);
      const snapshot = await fetchSchema(options, dependencies);
      writeRenderedOutput(schemaInfo(snapshot), options, dependencies);
    });
}
