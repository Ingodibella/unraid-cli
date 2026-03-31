import { Command } from 'commander';
import type { SchemaCommandDependencies } from './shared.js';
import {
  applySchemaCommandOptions,
  defaultSchemaCommandDependencies,
  fetchSchema,
  listMutations,
  resolveSchemaOptions,
  writeRenderedOutput,
} from './shared.js';

export function createSchemaMutationsCommand(
  dependencies: SchemaCommandDependencies = defaultSchemaCommandDependencies,
): Command {
  return applySchemaCommandOptions(new Command('mutations'))
    .description('List all top-level mutation fields')
    .action(async function handleSchemaMutations() {
      const options = resolveSchemaOptions(this);
      const snapshot = await fetchSchema(options, dependencies);
      writeRenderedOutput(listMutations(snapshot), options, dependencies);
    });
}
