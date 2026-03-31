import { Command } from 'commander';
import type { SystemCommandDependencies } from './shared.js';
import {
  applySystemCommandOptions,
  defaultSystemCommandDependencies,
  fetchSystemSnapshot,
  resolveSystemOptions,
  writeRenderedOutput,
} from './shared.js';

export interface SystemStatusRecord {
  serverStatus: string | null;
  arrayState: string;
  parityCheckStatus: string;
}

export function mapSystemStatus(snapshot: Awaited<ReturnType<typeof fetchSystemSnapshot>>): SystemStatusRecord {
  return {
    serverStatus: snapshot.server?.status ?? null,
    arrayState: snapshot.array.state,
    parityCheckStatus: snapshot.array.parityCheckStatus.status,
  };
}

export function createSystemStatusCommand(
  dependencies: SystemCommandDependencies = defaultSystemCommandDependencies,
): Command {
  return applySystemCommandOptions(new Command('status'))
    .description('Show array, docker, VM, and key metric status')
    .action(async function handleStatus() {
      const options = resolveSystemOptions(this);
      const snapshot = await fetchSystemSnapshot(options, dependencies);
      writeRenderedOutput(mapSystemStatus(snapshot), options, dependencies);
    });
}
