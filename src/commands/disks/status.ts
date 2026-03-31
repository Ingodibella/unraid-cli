import { Command } from 'commander';
import { applyFilters, applySort } from '../../core/filters/index.js';
import type { DisksCommandDependencies } from './shared.js';
import {
  applyDisksListOptions,
  defaultDisksCommandDependencies,
  fetchDisks,
  paginateItems,
  resolveDisksOptions,
  writeRenderedOutput,
} from './shared.js';

export interface DiskStatusRecord {
  name: string | null;
  status: string | null;
  smartStatus: string | null;
  temp: number | null;
}

export function createDisksStatusCommand(
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): Command {
  return applyDisksListOptions(new Command('status'))
    .description('Show health status overview for all disks')
    .action(async function handleDisksStatus() {
      const options = resolveDisksOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const snapshot = await fetchDisks(options, dependencies);

      let rows = snapshot.disks.map((disk) => ({
        name: disk.name,
        status: disk.status,
        smartStatus: disk.smartStatus,
        temp: disk.temperature,
      } satisfies DiskStatusRecord));

      if (localOptions.filter) {
        rows = applyFilters(rows, localOptions.filter);
      }

      if (localOptions.sort) {
        rows = applySort(rows, localOptions.sort);
      }

      writeRenderedOutput(paginateItems(rows, options), options, dependencies);
    });
}
