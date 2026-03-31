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

export interface SystemResourcesRecord {
  cpuUsage: number | null;
  memoryUsed: number | null;
  memoryTotal: number | null;
  memoryUsagePercent: number | null;
  storageUsed: number | null;
  storageTotal: number | null;
  storageUsagePercent: number | null;
  cacheUsagePercent: number | null;
}

export function mapSystemResources(snapshot: Awaited<ReturnType<typeof fetchSystemSnapshot>>): SystemResourcesRecord {
  return {
    cpuUsage: snapshot.server.cpuUsage,
    memoryUsed: snapshot.server.memoryUsage,
    memoryTotal: snapshot.server.memoryTotal,
    memoryUsagePercent: percent(snapshot.server.memoryUsage, snapshot.server.memoryTotal),
    storageUsed: snapshot.server.storageUsed,
    storageTotal: snapshot.server.storageTotal,
    storageUsagePercent: percent(snapshot.server.storageUsed, snapshot.server.storageTotal),
    cacheUsagePercent: snapshot.server.cacheUsage,
  };
}

export function createSystemResourcesCommand(
  dependencies: SystemCommandDependencies = defaultSystemCommandDependencies,
): Command {
  return applySystemCommandOptions(new Command('resources'))
    .description('Show CPU, memory, and storage utilization')
    .action(async function handleResources() {
      const options = resolveSystemOptions(this);
      const snapshot = await fetchSystemSnapshot(options, dependencies);
      writeRenderedOutput(mapSystemResources(snapshot), options, dependencies);
    });
}
