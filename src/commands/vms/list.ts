import { Command } from 'commander';
import { applyFilters, applySort } from '../../core/filters/index.js';
import type { VmsCommandDependencies } from './shared.js';
import {
  applyVmsListOptions,
  defaultVmsCommandDependencies,
  fetchVms,
  formatBytes,
  paginateItems,
  resolveVmsOptions,
  writeRenderedOutput,
} from './shared.js';

export interface VmListRecord {
  name: string | null;
  status: string | null;
  vcpus: number | null;
  memory: string;
  diskSize: string;
}

export function createVmsListCommand(
  dependencies: VmsCommandDependencies = defaultVmsCommandDependencies,
): Command {
  return applyVmsListOptions(new Command('list'))
    .description('List all VMs with status, vCPUs, memory, and disk size')
    .action(async function handleVmsList() {
      const options = resolveVmsOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const snapshot = await fetchVms(options, dependencies);

      let rows = snapshot.vms.map((vm) => ({
        name: vm.name,
        status: vm.status,
        vcpus: vm.vcpus,
        memory: formatBytes(vm.memory),
        diskSize: formatBytes(vm.diskSize),
      } satisfies VmListRecord));

      if (localOptions.filter) {
        rows = applyFilters(rows, localOptions.filter);
      }

      if (localOptions.sort) {
        rows = applySort(rows, localOptions.sort);
      }

      writeRenderedOutput(paginateItems(rows, options), options, dependencies);
    });
}
