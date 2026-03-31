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
  parityStatus: string | null;
  parityProgress: number | null;
  cpuTemp: number | null;
  motherboardTemp: number | null;
  arrayTemp: number | null;
  disks: Array<{
    name: string | null;
    status: string | null;
    temperature: number | null;
  }>;
}

export function mapSystemHealth(snapshot: Awaited<ReturnType<typeof fetchSystemSnapshot>>): SystemHealthRecord {
  return {
    parityStatus: snapshot.server.parityStatus,
    parityProgress: snapshot.server.parityProgress,
    cpuTemp: snapshot.server.temps?.cpu ?? null,
    motherboardTemp: snapshot.server.temps?.motherboard ?? null,
    arrayTemp: snapshot.server.temps?.array ?? null,
    disks: snapshot.server.disks.map((disk) => ({
      name: disk.name,
      status: disk.status,
      temperature: disk.temperature,
    })),
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
