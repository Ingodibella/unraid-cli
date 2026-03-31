import { Command } from 'commander';
import { applyFilters, applySort } from '../../core/filters/index.js';
import type { DisksCommandDependencies } from './shared.js';
import {
  applyDisksListOptions,
  defaultDisksCommandDependencies,
  fetchDisks,
  getTemperatureSeverity,
  paginateItems,
  resolveDisksOptions,
  writeRenderedOutput,
} from './shared.js';

export interface DiskTempRecord {
  name: string | null;
  temp: number | null;
  severity: string;
}

export function createDisksTempCommand(
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): Command {
  return applyDisksListOptions(new Command('temp'))
    .description('Show disk temperatures and threshold severity')
    .action(async function handleDisksTemp() {
      const options = resolveDisksOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const snapshot = await fetchDisks(options, dependencies);

      let rows = snapshot.disks.map((disk) => ({
        name: disk.name,
        temp: disk.temperature,
        severity: getTemperatureSeverity(disk.temperature),
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
