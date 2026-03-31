import { Command } from 'commander';
import { applyFilters, applySort } from '../../core/filters/index.js';
import type { DisksCommandDependencies } from './shared.js';
import {
  applyDisksListOptions,
  defaultDisksCommandDependencies,
  fetchDisks,
  formatBytes,
  paginateItems,
  resolveDisksOptions,
  usagePercent,
  writeRenderedOutput,
} from './shared.js';

export interface DiskUsageRecord {
  name: string | null;
  used: string;
  free: string;
  total: string;
  usagePercent: number | null;
}

export function createDisksUsageCommand(
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): Command {
  return applyDisksListOptions(new Command('usage'))
    .description('Show storage utilization per disk')
    .action(async function handleDisksUsage() {
      const options = resolveDisksOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const snapshot = await fetchDisks(options, dependencies);

      let rows = snapshot.disks.map((disk) => ({
        name: disk.name,
        used: formatBytes(disk.used),
        free: formatBytes(disk.free),
        total: formatBytes(disk.size),
        usagePercent: usagePercent(disk.used, disk.size),
      } satisfies DiskUsageRecord));

      if (localOptions.filter) {
        rows = applyFilters(rows, localOptions.filter);
      }

      if (localOptions.sort) {
        rows = applySort(rows, localOptions.sort);
      }

      writeRenderedOutput(paginateItems(rows, options), options, dependencies);
    });
}
