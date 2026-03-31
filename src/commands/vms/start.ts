import { Command } from 'commander';
import { VM_START_MUTATION } from '../../generated/vms.js';
import type { VmsCommandDependencies } from './shared.js';
import {
  applyVmsCommandOptions,
  defaultVmsCommandDependencies,
  executeVmWriteAction,
  resolveVmsOptions,
  writeRenderedOutput,
} from './shared.js';

export function createVmsStartCommand(
  dependencies: VmsCommandDependencies = defaultVmsCommandDependencies,
): Command {
  return applyVmsCommandOptions(new Command('start'))
    .argument('<id-or-name>', 'VM id or name')
    .description('Start a VM')
    .action(async function handleVmsStart(idOrName: string) {
      const options = resolveVmsOptions(this);
      const result = await executeVmWriteAction({
        action: 'start',
        commandPath: 'vms.start',
        mutation: VM_START_MUTATION,
        idOrName,
        options,
        dependencies,
      });

      writeRenderedOutput(result, options, dependencies);
    });
}
