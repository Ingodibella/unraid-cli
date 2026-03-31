import { Command } from 'commander';
import type { VmsCommandDependencies } from './shared.js';
import {
  applyVmsCommandOptions,
  defaultVmsCommandDependencies,
  fetchVm,
  formatBytes,
  resolveVmsOptions,
  writeRenderedOutput,
} from './shared.js';

export interface VmDetailRecord {
  id: string | null;
  name: string | null;
  status: string | null;
  state: string | null;
  vcpus: number | null;
  memory: string;
  diskSize: string;
  os: string | null;
  autostart: boolean | null;
  ipAddress: string | null;
  vncPort: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export function createVmsGetCommand(
  dependencies: VmsCommandDependencies = defaultVmsCommandDependencies,
): Command {
  return applyVmsCommandOptions(new Command('get'))
    .argument('<name>', 'VM name')
    .description('Show detailed information for a single VM')
    .action(async function handleVmsGet(name: string) {
      const options = resolveVmsOptions(this);
      const vm = await fetchVm(name, options, dependencies);

      writeRenderedOutput({
        id: vm.id,
        name: vm.name,
        status: vm.status,
        state: vm.state,
        vcpus: vm.vcpus,
        memory: formatBytes(vm.memory),
        diskSize: formatBytes(vm.diskSize),
        os: vm.os,
        autostart: vm.autostart,
        ipAddress: vm.ipAddress,
        vncPort: vm.vncPort,
        createdAt: vm.createdAt,
        updatedAt: vm.updatedAt,
      } satisfies VmDetailRecord, options, dependencies);
    });
}
