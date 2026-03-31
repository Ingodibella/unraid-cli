import { Command } from 'commander';
import { InvalidUsageError } from '../../core/errors/graphql-errors.js';
import type { DiagnosticsCommandDependencies } from './shared.js';
import {
  applyDiagnosticsCommandOptions,
  createDiagnosticsClient,
  defaultDiagnosticsCommandDependencies,
  resolveDiagnosticsOptions,
  writeDiagnosticsOutput,
} from './shared.js';

export function createDiagnosticsGraphqlCommand(
  dependencies: DiagnosticsCommandDependencies = defaultDiagnosticsCommandDependencies,
): Command {
  return applyDiagnosticsCommandOptions(new Command('graphql'))
    .description('Execute a raw GraphQL query from a file')
    .requiredOption('--query <file>', 'Path to GraphQL query file')
    .action(async function handleGraphql() {
      const options = resolveDiagnosticsOptions(this);
      const local = this.opts<{ query?: string }>();
      if (!local.query) {
        throw new InvalidUsageError('Missing --query <file>');
      }

      const client = createDiagnosticsClient(options, dependencies);
      const query = dependencies.readTextFile(local.query);
      const result = await client.execute<Record<string, unknown>>(query);
      writeDiagnosticsOutput(result, options, dependencies);
    });
}
