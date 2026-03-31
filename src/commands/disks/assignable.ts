import { Command } from 'commander';
import { applyFilters, applySort } from '../../core/filters/index.js';
import type { DisksCommandDependencies } from './shared.js';
import {
  applyDisksListOptions,
  defaultDisksCommandDependencies,
  fetchAssignableDisks,
  formatBytes,
  paginateItems,
  resolveDisksOptions,
  writeRenderedOutput,
} from './shared.js';

export interface AssignableDiskListRecord {
  name: string | null;
  device: string | null;
  size: string;
  type: string | null;
}

export function createDisksAssignableCommand(
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): Command {
  const assignable = new Command('assignable').description('Assignable disk operations');

  assignable.addCommand(
    applyDisksListOptions(new Command('list'))
      .description('List disks available for assignment')
      .action(async function handleAssignableList() {
        const options = resolveDisksOptions(this);
        const localOptions = this.opts<{ filter?: string; sort?: string }>();
        const snapshot = await fetchAssignableDisks(options, dependencies);

        let rows = snapshot.assignableDisks.map((disk) => ({
          name: disk.name,
          device: disk.device,
          size: formatBytes(disk.size),
          type: disk.type,
        } satisfies AssignableDiskListRecord));

        if (localOptions.filter) {
          rows = applyFilters(rows, localOptions.filter);
        }

        if (localOptions.sort) {
          rows = applySort(rows, localOptions.sort);
        }

        writeRenderedOutput(paginateItems(rows, options), options, dependencies);
      }),
  );

  return assignable;
}
