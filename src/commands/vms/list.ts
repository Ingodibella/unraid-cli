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

export function createVmsListCommand(
  dependencies: VmsCommandDependencies = defaultVmsCommandDependencies,
): Command {
  return applyVmsListOptions(new Command('list'))
    .description('List all VMs')
    .action(async function handleVmsList() {
      const options = resolveVmsOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const vms = await fetchVms(options, dependencies);

      let rows = vms.map((vm) => ({
        id: vm.id,
        name: vm.name,
        state: vm.state,
      }));

      if (localOptions.filter) {
        rows = applyFilters(rows, localOptions.filter);
      }

      if (localOptions.sort) {
        rows = applySort(rows, localOptions.sort);
      }

      writeRenderedOutput(paginateItems(rows, options), options, dependencies);
    });
}
