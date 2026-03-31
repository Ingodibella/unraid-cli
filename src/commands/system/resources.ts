import { Command } from 'commander';
import type { SystemCommandDependencies } from './shared.js';
import {
  applySystemCommandOptions,
  defaultSystemCommandDependencies,
  fetchSystemSnapshot,
  resolveSystemOptions,
  writeRenderedOutput,
} from './shared.js';

export interface SystemResourcesRecord {
  memoryModules: number;
  memoryTotalBytes: number;
  cpuCores: number | null;
  cpuThreads: number | null;
  cpuSpeedGHz: number | null;
}

export function mapSystemResources(snapshot: Awaited<ReturnType<typeof fetchSystemSnapshot>>): SystemResourcesRecord {
  const modules = snapshot.info.memory.layout;
  return {
    memoryModules: modules.length,
    memoryTotalBytes: modules.reduce((total, module) => total + (module.size ?? 0), 0),
    cpuCores: snapshot.info.cpu.cores,
    cpuThreads: snapshot.info.cpu.threads,
    cpuSpeedGHz: snapshot.info.cpu.speed,
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
