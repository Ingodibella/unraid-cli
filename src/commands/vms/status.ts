import { Command } from 'commander';
import { applyFilters, applySort } from '../../core/filters/index.js';
import type { VmsCommandDependencies } from './shared.js';
import {
  applyVmsListOptions,
  defaultVmsCommandDependencies,
  fetchVms,
  paginateItems,
  resolveVmsOptions,
  writeRenderedOutput,
} from './shared.js';

export function createVmsStatusCommand(
  dependencies: VmsCommandDependencies = defaultVmsCommandDependencies,
): Command {
  return applyVmsListOptions(new Command('status'))
    .description('Show VM state overview')
    .action(async function handleVmsStatus() {
      const options = resolveVmsOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const vms = await fetchVms(options, dependencies);

      let rows = vms.map((vm) => ({ id: vm.id, name: vm.name, state: vm.state }));

      if (localOptions.filter) {
        rows = applyFilters(rows, localOptions.filter);
      }

      if (localOptions.sort) {
        rows = applySort(rows, localOptions.sort);
      }

      const summary = vms.reduce((counts, vm) => {
        const state = (vm.state ?? 'NOSTATE').toUpperCase();
        if (state === 'RUNNING' || state === 'IDLE') counts.running += 1;
        else if (state === 'PAUSED') counts.paused += 1;
        else if (state === 'SHUTDOWN' || state === 'SHUTOFF') counts.stopped += 1;
        else counts.other += 1;
        return counts;
      }, { running: 0, stopped: 0, paused: 0, other: 0 });

      writeRenderedOutput({ summary, vms: paginateItems(rows, options) }, options, dependencies);
    });
}
