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

const LATENCY_QUERY = `
  query DiagnosticsLatency {
    info {
      osPlatform
    }
  }
`;

const DEFAULT_SAMPLES = 5;

export interface LatencyResult {
  samples: number[];
  minMs: number;
  maxMs: number;
  avgMs: number;
  p95Ms: number;
}

export function createDiagnosticsLatencyCommand(
  dependencies: DiagnosticsCommandDependencies = defaultDiagnosticsCommandDependencies,
): Command {
  return applyDiagnosticsCommandOptions(new Command('latency'))
    .description('Measure endpoint round-trip time with multiple samples')
    .action(async function handleLatency() {
      const options = resolveDiagnosticsOptions(this);
      const client = createDiagnosticsClient(options, dependencies);
      const samples: number[] = [];

      for (let index = 0; index < DEFAULT_SAMPLES; index += 1) {
        const startedAt = dependencies.now();
        try {
          await client.execute(LATENCY_QUERY);
        } catch (error) {
          throw new TransportError(error instanceof Error ? error.message : 'Latency probe failed', error);
        }
        samples.push(dependencies.now() - startedAt);
      }

      const result: LatencyResult = {
        samples,
        minMs: Math.min(...samples),
        maxMs: Math.max(...samples),
        avgMs: Number((samples.reduce((sum, value) => sum + value, 0) / samples.length).toFixed(2)),
        p95Ms: percentile(samples, 0.95),
      };

      writeDiagnosticsOutput(result, options, dependencies);
    });
}

function percentile(values: number[], quantile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const position = Math.ceil(quantile * sorted.length) - 1;
  const index = Math.min(Math.max(position, 0), sorted.length - 1);
  return sorted[index] ?? 0;
}
