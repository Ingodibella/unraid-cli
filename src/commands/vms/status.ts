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

export interface VmStatusRecord {
  name: string | null;
  status: string | null;
  state: string | null;
}

export function createVmsStatusCommand(
  dependencies: VmsCommandDependencies = defaultVmsCommandDependencies,
): Command {
  return applyVmsListOptions(new Command('status'))
    .description('Show running and stopped VM status overview')
    .action(async function handleVmsStatus() {
      const options = resolveVmsOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const snapshot = await fetchVms(options, dependencies);

      let vms = snapshot.vms.map((vm) => ({
        name: vm.name,
        status: vm.status,
        state: vm.state,
      } satisfies VmStatusRecord));

      if (localOptions.filter) {
        vms = applyFilters(vms, localOptions.filter);
      }

      if (localOptions.sort) {
        vms = applySort(vms, localOptions.sort);
      }

      const summary = snapshot.vms.reduce((counts, vm) => {
        const normalized = (vm.state ?? vm.status ?? 'unknown').toLowerCase();
        if (normalized.includes('run')) {
          counts.running += 1;
        } else if (normalized.includes('stop') || normalized.includes('shut')) {
          counts.stopped += 1;
        } else if (normalized.includes('pause')) {
          counts.paused += 1;
        } else {
          counts.other += 1;
        }
        return counts;
      }, { running: 0, stopped: 0, paused: 0, other: 0 });

      writeRenderedOutput({
        summary,
        vms: paginateItems(vms, options),
      }, options, dependencies);
    });
}
