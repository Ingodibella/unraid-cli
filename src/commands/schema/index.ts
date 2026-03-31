import { Command } from 'commander';
import type { SchemaCommandDependencies } from './shared.js';
import { defaultSchemaCommandDependencies } from './shared.js';
import { createSchemaDiffCommand } from './diff.js';
import { createSchemaExportCommand } from './export.js';
import { createSchemaFieldsCommand } from './fields.js';
import { createSchemaInfoCommand } from './info.js';
import { createSchemaMutationsCommand } from './mutations.js';
import { createSchemaQueriesCommand } from './queries.js';
import { createSchemaTypeCommand } from './type.js';
import { createSchemaValidateCommand } from './validate.js';

export function createSchemaCommand(
  dependencies: SchemaCommandDependencies = defaultSchemaCommandDependencies,
): Command {
  return new Command('schema')
    .description('Explore and validate the live GraphQL schema')
    .addCommand(createSchemaInfoCommand(dependencies))
    .addCommand(createSchemaQueriesCommand(dependencies))
    .addCommand(createSchemaMutationsCommand(dependencies))
    .addCommand(createSchemaTypeCommand(dependencies))
    .addCommand(createSchemaFieldsCommand(dependencies))
    .addCommand(createSchemaExportCommand(dependencies))
    .addCommand(createSchemaDiffCommand(dependencies))
    .addCommand(createSchemaValidateCommand(dependencies));
}
