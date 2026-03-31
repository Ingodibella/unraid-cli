import { Command } from 'commander';
import type { SchemaCommandDependencies } from './shared.js';
import {
  applySchemaCommandOptions,
  defaultSchemaCommandDependencies,
  fetchSchema,
  resolveSchemaOptions,
  toSchemaTypeRecord,
  writeRenderedOutput,
} from './shared.js';

export function createSchemaTypeCommand(
  dependencies: SchemaCommandDependencies = defaultSchemaCommandDependencies,
): Command {
  return applySchemaCommandOptions(new Command('type'))
    .argument('<name>', 'GraphQL type name')
    .description('Inspect a schema type and list its fields')
    .action(async function handleSchemaType(name: string) {
      const options = resolveSchemaOptions(this);
      const snapshot = await fetchSchema(options, dependencies);
      writeRenderedOutput(toSchemaTypeRecord(snapshot, name), options, dependencies);
    });
}
