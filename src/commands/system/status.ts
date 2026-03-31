import { Command } from 'commander';
import type { SystemCommandDependencies } from './shared.js';
import {
  applySystemCommandOptions,
  defaultSystemCommandDependencies,
  fetchSystemSnapshot,
  percent,
  resolveSystemOptions,
  writeRenderedOutput,
} from './shared.js';

export interface SystemStatusRecord {
  arrayState: string | null;
  dockerStatus: string;
  vmStatus: string;
  cpuUsage: number | null;
  memoryUsagePercent: number | null;
  storageUsagePercent: number | null;
}

export function mapSystemStatus(snapshot: Awaited<ReturnType<typeof fetchSystemSnapshot>>): SystemStatusRecord {
  return {
    arrayState: snapshot.server.state,
    dockerStatus: snapshot.server.dockerRunning ? 'running' : 'stopped',
    vmStatus: snapshot.server.vmRunning ? 'running' : 'stopped',
    cpuUsage: snapshot.server.cpuUsage,
    memoryUsagePercent: percent(snapshot.server.memoryUsage, snapshot.server.memoryTotal),
    storageUsagePercent: percent(snapshot.server.storageUsed, snapshot.server.storageTotal),
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
