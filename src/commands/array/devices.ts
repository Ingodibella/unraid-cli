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
  idx: number | null;
  name: string | null;
  device: string | null;
  size: string;
  status: string | null;
  rotational: boolean | null;
  temp: string;
  numReads: number | null;
  numWrites: number | null;
  numErrors: number | null;
}

export function mapArrayDevice(disk: {
  idx?: number | null;
  name: string | null;
  device: string | null;
  size: number | null;
  status: string | null;
  rotational?: boolean | null;
  temp: number | null;
  numReads?: number | null;
  numWrites?: number | null;
  numErrors?: number | null;
}): ArrayDeviceRecord {
  return {
    idx: disk.idx ?? null,
    name: disk.name,
    device: disk.device,
    size: formatBytes(disk.size != null ? disk.size * 1024 : null),
    status: disk.status,
    rotational: disk.rotational ?? null,
    temp: disk.temp != null ? `${disk.temp}C` : 'unknown',
    numReads: disk.numReads ?? null,
    numWrites: disk.numWrites ?? null,
    numErrors: disk.numErrors ?? null,
  };
}

export function createArrayDevicesCommand(
  dependencies: ArrayCommandDependencies = defaultArrayCommandDependencies,
): Command {
  return applyArrayDevicesOptions(new Command('devices'))
    .description('List array disks with schema-aligned fields')
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
