import { Command } from 'commander';
import { TransportError } from '../../core/errors/transport-errors.js';
import type { DiagnosticsCommandDependencies } from './shared.js';
import {
  applyDiagnosticsCommandOptions,
  createDiagnosticsClient,
  defaultDiagnosticsCommandDependencies,
  resolveDiagnosticsOptions,
  writeDiagnosticsOutput,
} from './shared.js';

const PING_QUERY = `
  query DiagnosticsPing {
    info {
      osPlatform
    }
  }
`;

export interface PingResult {
  ok: boolean;
  latencyMs: number;
}

export function createDiagnosticsPingCommand(
  dependencies: DiagnosticsCommandDependencies = defaultDiagnosticsCommandDependencies,
): Command {
  return applyDiagnosticsCommandOptions(new Command('ping'))
    .description('Check if the GraphQL endpoint responds')
    .action(async function handlePing() {
      const options = resolveDiagnosticsOptions(this);
      const client = createDiagnosticsClient(options, dependencies);
      const startedAt = dependencies.now();

      try {
        await client.execute(PING_QUERY);
      } catch (error) {
        throw new TransportError(error instanceof Error ? error.message : 'Ping failed', error);
      }

      const result: PingResult = {
        ok: true,
        latencyMs: dependencies.now() - startedAt,
      };

      writeDiagnosticsOutput(result, options, dependencies);
    });
}
