import { Command } from 'commander';
import { VM_RESET_MUTATION } from '../../generated/vms.js';
import type { VmsCommandDependencies } from './shared.js';
import {
  applyVmsCommandOptions,
  defaultVmsCommandDependencies,
  executeVmWriteAction,
  resolveVmsOptions,
  writeRenderedOutput,
} from './shared.js';

export function createVmsResetCommand(
  dependencies: VmsCommandDependencies = defaultVmsCommandDependencies,
): Command {
  return applyVmsCommandOptions(new Command('reset'))
    .argument('<name>', 'VM name')
    .description('Hard-reset a VM')
    .action(async function handleVmsReset(name: string) {
      const options = resolveVmsOptions(this);
      const result = await executeVmWriteAction({
        action: 'reset',
        commandPath: 'vms.reset',
        mutation: VM_RESET_MUTATION,
        name,
        options,
        dependencies,
      });

      writeRenderedOutput(result, options, dependencies);
    });
}
