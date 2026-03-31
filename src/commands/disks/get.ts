import { Command } from 'commander';
import type { DisksCommandDependencies } from './shared.js';
import {
  applyDisksCommandOptions,
  defaultDisksCommandDependencies,
  fetchDisk,
  formatBytes,
  formatTemperature,
  getTemperatureSeverity,
  resolveDisksOptions,
  usagePercent,
  writeRenderedOutput,
} from './shared.js';

export interface DiskDetailRecord {
  name: string | null;
  device: string | null;
  size: string;
  used: string;
  free: string;
  usagePercent: number | null;
  status: string | null;
  temp: string;
  tempSeverity: string;
  type: string | null;
  filesystem: string | null;
  serial: string | null;
  model: string | null;
  smartStatus: string | null;
}

export function createDisksGetCommand(
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): Command {
  return applyDisksCommandOptions(new Command('get'))
    .argument('<name>', 'Disk name')
    .description('Show detailed information for a single disk')
    .action(async function handleDisksGet(name: string) {
      const options = resolveDisksOptions(this);
      const disk = await fetchDisk(name, options, dependencies);

      writeRenderedOutput({
        name: disk.name,
        device: disk.device,
        size: formatBytes(disk.size),
        used: formatBytes(disk.used),
        free: formatBytes(disk.free),
        usagePercent: usagePercent(disk.used, disk.size),
        status: disk.status,
        temp: formatTemperature(disk.temperature),
        tempSeverity: getTemperatureSeverity(disk.temperature),
        type: disk.type,
        filesystem: disk.filesystem,
        serial: disk.serial,
        model: disk.model,
        smartStatus: disk.smartStatus,
      } satisfies DiskDetailRecord, options, dependencies);
    });
}
