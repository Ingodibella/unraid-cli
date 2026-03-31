import { Command } from 'commander';
import type { SystemCommandDependencies } from './shared.js';
import {
  applySystemCommandOptions,
  defaultSystemCommandDependencies,
  fetchSystemSnapshot,
  resolveSystemOptions,
  writeRenderedOutput,
} from './shared.js';

export interface SystemHealthRecord {
  parityStatus: string;
  parityProgress: number | null;
  parityRunning: boolean | null;
  parityPaused: boolean | null;
  serverStatus: string | null;
}

export function mapSystemHealth(snapshot: Awaited<ReturnType<typeof fetchSystemSnapshot>>): SystemHealthRecord {
  return {
    parityStatus: snapshot.array.parityCheckStatus.status,
    parityProgress: snapshot.array.parityCheckStatus.progress,
    parityRunning: snapshot.array.parityCheckStatus.running,
    parityPaused: snapshot.array.parityCheckStatus.paused,
    serverStatus: snapshot.server?.status ?? null,
  };
}

export function createSystemHealthCommand(
  dependencies: SystemCommandDependencies = defaultSystemCommandDependencies,
): Command {
  return applySystemCommandOptions(new Command('health'))
    .description('Show health indicators, temperatures, and parity status')
    .action(async function handleHealth() {
      const options = resolveSystemOptions(this);
      const snapshot = await fetchSystemSnapshot(options, dependencies);
      writeRenderedOutput(mapSystemHealth(snapshot), options, dependencies);
    });
}
