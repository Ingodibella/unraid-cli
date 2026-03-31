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
    .argument('<id-or-name>', 'VM id or name')
    .description('Show VM object as returned by API')
    .action(async function handleVmsInspect(idOrName: string) {
      const options = resolveVmsOptions(this);
      const vm = await fetchVm(idOrName, options, dependencies);
      writeRenderedOutput(vm, options, dependencies);
    });
}
