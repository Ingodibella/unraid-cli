import { Command } from 'commander';
import type { SchemaCommandDependencies } from './shared.js';
import {
  applySchemaCommandOptions,
  defaultSchemaCommandDependencies,
  fetchSchema,
  listQueries,
  resolveSchemaOptions,
  writeRenderedOutput,
} from './shared.js';

export function createSchemaQueriesCommand(
  dependencies: SchemaCommandDependencies = defaultSchemaCommandDependencies,
): Command {
  return applySchemaCommandOptions(new Command('queries'))
    .description('List all top-level query fields')
    .action(async function handleSchemaQueries() {
      const options = resolveSchemaOptions(this);
      const snapshot = await fetchSchema(options, dependencies);
      writeRenderedOutput(listQueries(snapshot), options, dependencies);
    });
}
