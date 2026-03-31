import { Command } from 'commander';
import type { SchemaCommandDependencies } from './shared.js';
import {
  applySchemaCommandOptions,
  buildSchemaDiff,
  defaultSchemaCommandDependencies,
  fetchSchema,
  readSnapshot,
  resolveSchemaOptions,
  writeRenderedOutput,
} from './shared.js';

export function createSchemaDiffCommand(
  dependencies: SchemaCommandDependencies = defaultSchemaCommandDependencies,
): Command {
  return applySchemaCommandOptions(new Command('diff'))
    .option('--snapshot <path>', 'Schema snapshot path to compare against', 'schema.snapshot.json')
    .description('Compare live schema against a stored snapshot')
    .action(async function handleSchemaDiff() {
      const options = resolveSchemaOptions(this);
      const localOptions = this.opts<{ snapshot: string }>();
      const [base, live] = await Promise.all([
        readSnapshot(localOptions.snapshot),
        fetchSchema(options, dependencies),
      ]);

      writeRenderedOutput(buildSchemaDiff(base, live), options, dependencies);
    });
}
