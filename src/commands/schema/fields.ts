import { Command } from 'commander';
import type { SchemaCommandDependencies } from './shared.js';
import {
  applySchemaCommandOptions,
  buildSchemaFieldTree,
  defaultSchemaCommandDependencies,
  fetchSchema,
  resolveSchemaOptions,
  writeRenderedOutput,
} from './shared.js';

export function createSchemaFieldsCommand(
  dependencies: SchemaCommandDependencies = defaultSchemaCommandDependencies,
): Command {
  return applySchemaCommandOptions(new Command('fields'))
    .argument('<query>', 'Top-level query field name')
    .option('--depth <number>', 'Tree depth for nested object fields', Number.parseInt, 3)
    .description('Show recursive field tree for a top-level query')
    .action(async function handleSchemaFields(query: string) {
      const options = resolveSchemaOptions(this);
      const localOptions = this.opts<{ depth: number }>();
      const snapshot = await fetchSchema(options, dependencies);
      writeRenderedOutput(buildSchemaFieldTree(snapshot, query, localOptions.depth), options, dependencies);
    });
}
