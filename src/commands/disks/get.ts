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
  writeRenderedOutput,
} from './shared.js';

export interface DiskDetailRecord {
  id: string;
  name: string | null;
  device: string | null;
  size: string;
  vendor: string | null;
  type: string | null;
  bytesPerSector: number | null;
  totalSectors: number | null;
  totalHeads: number | null;
  totalCylinders: number | null;
  firmwareRevision: string | null;
  serialNum: string | null;
  interfaceType: string | null;
  smartStatus: string | null;
  temp: string;
  tempSeverity: string;
  partitions: Array<{ name: string; size: number; type?: string | null; fsType: string }>;
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
        id: disk.id,
        name: disk.name,
        device: disk.device,
        size: formatBytes(disk.size),
        vendor: disk.vendor,
        type: disk.type,
        bytesPerSector: disk.bytesPerSector,
        totalSectors: disk.totalSectors,
        totalHeads: disk.totalHeads,
        totalCylinders: disk.totalCylinders,
        firmwareRevision: disk.firmwareRevision,
        serialNum: disk.serialNum,
        interfaceType: disk.interfaceType,
        smartStatus: disk.smartStatus,
        temp: formatTemperature(disk.temperature),
        tempSeverity: getTemperatureSeverity(disk.temperature),
        partitions: disk.partitions,
      } satisfies DiskDetailRecord, options, dependencies);
    });
}
