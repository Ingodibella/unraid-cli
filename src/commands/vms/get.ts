import { Command } from 'commander';
import type { VmsCommandDependencies } from './shared.js';
import {
  applyVmsCommandOptions,
  defaultVmsCommandDependencies,
  fetchVm,
  resolveVmsOptions,
  writeRenderedOutput,
} from './shared.js';

export function createVmsGetCommand(
  dependencies: VmsCommandDependencies = defaultVmsCommandDependencies,
): Command {
  return applyVmsCommandOptions(new Command('get'))
    .argument('<id-or-name>', 'VM id or name')
    .description('Show a single VM')
    .action(async function handleVmsGet(idOrName: string) {
      const options = resolveVmsOptions(this);
      const vm = await fetchVm(idOrName, options, dependencies);
      writeRenderedOutput(vm, options, dependencies);
    });
}
