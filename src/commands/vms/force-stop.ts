import { Command } from 'commander';
import { VM_FORCE_STOP_MUTATION } from '../../generated/vms.js';
import type { VmsCommandDependencies } from './shared.js';
import {
  applyVmsCommandOptions,
  defaultVmsCommandDependencies,
  executeVmWriteAction,
  resolveVmsOptions,
  writeRenderedOutput,
} from './shared.js';

export function createVmsForceStopCommand(
  dependencies: VmsCommandDependencies = defaultVmsCommandDependencies,
): Command {
  return applyVmsCommandOptions(new Command('force-stop'))
    .argument('<name>', 'VM name')
    .description('Force-stop a VM')
    .action(async function handleVmsForceStop(name: string) {
      const options = resolveVmsOptions(this);
      const result = await executeVmWriteAction({
        action: 'force-stop',
        commandPath: 'vms.force-stop',
        mutation: VM_FORCE_STOP_MUTATION,
        name,
        options,
        dependencies,
      });

      writeRenderedOutput(result, options, dependencies);
    });
}
