import { Command } from 'commander';
import { VM_STOP_MUTATION } from '../../generated/vms.js';
import type { VmsCommandDependencies } from './shared.js';
import {
  applyVmsCommandOptions,
  defaultVmsCommandDependencies,
  executeVmWriteAction,
  resolveVmsOptions,
  writeRenderedOutput,
} from './shared.js';

export function createVmsStopCommand(
  dependencies: VmsCommandDependencies = defaultVmsCommandDependencies,
): Command {
  return applyVmsCommandOptions(new Command('stop'))
    .argument('<name>', 'VM name')
    .description('Gracefully stop a VM')
    .action(async function handleVmsStop(name: string) {
      const options = resolveVmsOptions(this);
      const result = await executeVmWriteAction({
        action: 'stop',
        commandPath: 'vms.stop',
        mutation: VM_STOP_MUTATION,
        name,
        options,
        dependencies,
      });

      writeRenderedOutput(result, options, dependencies);
    });
}
