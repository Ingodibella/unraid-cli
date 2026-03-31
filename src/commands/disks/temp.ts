import { Command } from 'commander';
import { applyFilters, applySort } from '../../core/filters/index.js';
import type { DisksCommandDependencies } from './shared.js';
import {
  applyDisksListOptions,
  defaultDisksCommandDependencies,
  fetchArrayDiskTemps,
  getTemperatureSeverity,
  paginateItems,
  resolveDisksOptions,
  writeRenderedOutput,
} from './shared.js';

export interface DiskTempRecord {
  idx: number | null;
  name: string | null;
  status: string | null;
  temp: number | null;
  severity: string;
}

export function createDisksTempCommand(
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): Command {
  return applyDisksListOptions(new Command('temp'))
    .description('Show array disk temperatures and threshold severity')
    .action(async function handleDisksTemp() {
      const options = resolveDisksOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const snapshot = await fetchArrayDiskTemps(options, dependencies);

      let rows = snapshot.array.disks.map((disk) => ({
        idx: disk.idx,
        name: disk.name,
        status: disk.status,
        temp: disk.temp,
        severity: getTemperatureSeverity(disk.temp),
      } satisfies DiskTempRecord));

      if (localOptions.filter) {
        rows = applyFilters(rows, localOptions.filter);
      }

      if (localOptions.sort) {
        rows = applySort(rows, localOptions.sort);
      }

      writeRenderedOutput(paginateItems(rows, options), options, dependencies);
    });
}
