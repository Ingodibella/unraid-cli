import { Command } from 'commander';
import { applyFilters } from '../../core/filters/filter.js';
import { applySort } from '../../core/filters/sort.js';
import type { ArrayCommandDependencies } from './shared.js';
import {
  applyArrayDevicesOptions,
  defaultArrayCommandDependencies,
  fetchArray,
  formatBytes,
  resolveArrayOptions,
  writeRenderedOutput,
} from './shared.js';

export interface ArrayDeviceRecord {
  name: string | null;
  size: string;
  status: string | null;
  temperature: string;
  filesystem: string | null;
}

export function mapArrayDevice(disk: {
  name: string | null;
  size: number | null;
  status: string | null;
  temperature: number | null;
  filesystem: string | null;
}): ArrayDeviceRecord {
  return {
    name: disk.name,
    size: formatBytes(disk.size),
    status: disk.status,
    temperature: disk.temperature != null ? `${disk.temperature}C` : 'unknown',
    filesystem: disk.filesystem,
  };
}

export function createArrayDevicesCommand(
  dependencies: ArrayCommandDependencies = defaultArrayCommandDependencies,
): Command {
  return applyArrayDevicesOptions(new Command('devices'))
    .description('List all array disks with name, size, status, temp, filesystem')
    .action(async function handleArrayDevices() {
      const options = resolveArrayOptions(this);
      const snapshot = await fetchArray(options, dependencies);
      const opts = this.opts<{ filter?: string; sort?: string }>();

      let disks = snapshot.array.disks.map(mapArrayDevice);

      if (opts.filter) {
        disks = applyFilters(disks, opts.filter);
      }

      if (opts.sort) {
        disks = applySort(disks, opts.sort);
      }

      writeRenderedOutput(disks, options, dependencies);
    });
}
