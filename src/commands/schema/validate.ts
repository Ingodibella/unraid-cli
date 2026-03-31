import { Command } from 'commander';
import type { SchemaCommandDependencies } from './shared.js';
import {
  applySchemaCommandOptions,
  defaultSchemaCommandDependencies,
  fetchSchema,
  resolveSchemaOptions,
  validateKnownOperations,
  writeRenderedOutput,
} from './shared.js';

export function createSchemaValidateCommand(
  dependencies: SchemaCommandDependencies = defaultSchemaCommandDependencies,
): Command {
  return applySchemaCommandOptions(new Command('validate'))
    .description('Validate known ucli operations against the live schema')
    .action(async function handleSchemaValidate() {
      const options = resolveSchemaOptions(this);
      const snapshot = await fetchSchema(options, dependencies);
      writeRenderedOutput(validateKnownOperations(snapshot), options, dependencies);
    });
}
