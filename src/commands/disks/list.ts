import { Command } from 'commander';
import { applyFilters, applySort } from '../../core/filters/index.js';
import type { DisksCommandDependencies } from './shared.js';
import {
  applyDisksListOptions,
  defaultDisksCommandDependencies,
  fetchDisks,
  formatBytes,
  formatTemperature,
  paginateItems,
  resolveDisksOptions,
  writeRenderedOutput,
} from './shared.js';

export interface DiskListRecord {
  name: string | null;
  size: string;
  status: string | null;
  temp: string;
  type: string | null;
}

export function mapDiskListRecord(disk: Awaited<ReturnType<typeof fetchDisks>>['disks'][number]): DiskListRecord {
  return {
    name: disk.name,
    size: formatBytes(disk.size),
    status: disk.status,
    temp: formatTemperature(disk.temperature),
    type: disk.type,
  };
}

export function createDisksListCommand(
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): Command {
  return applyDisksListOptions(new Command('list'))
    .description('List all disks with size, health, temperature, and type')
    .action(async function handleDisksList() {
      const options = resolveDisksOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const snapshot = await fetchDisks(options, dependencies);

      let disks = snapshot.disks.map(mapDiskListRecord);

      if (localOptions.filter) {
        disks = applyFilters(disks, localOptions.filter);
      }

      if (localOptions.sort) {
        disks = applySort(disks, localOptions.sort);
      }

      writeRenderedOutput(paginateItems(disks, options), options, dependencies);
    });
}
