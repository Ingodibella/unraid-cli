import { Command } from 'commander';
import type { VmsCommandDependencies } from './shared.js';
import {
  applyVmsCommandOptions,
  defaultVmsCommandDependencies,
  fetchVm,
  resolveVmsOptions,
  writeRenderedOutput,
} from './shared.js';

export function createVmsInspectCommand(
  dependencies: VmsCommandDependencies = defaultVmsCommandDependencies,
): Command {
  return applyVmsCommandOptions(new Command('inspect'))
    .argument('<name>', 'VM name')
    .description('Show the raw inspect payload for a single VM')
    .action(async function handleVmsInspect(name: string) {
      const options = resolveVmsOptions(this);
      const vm = await fetchVm(name, options, dependencies);
      writeRenderedOutput(vm.inspect ?? {}, options, dependencies);
    });
}
