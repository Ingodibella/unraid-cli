import { Command } from 'commander';
import { VM_REBOOT_MUTATION } from '../../generated/vms.js';
import type { VmsCommandDependencies } from './shared.js';
import {
  applyVmsCommandOptions,
  defaultVmsCommandDependencies,
  executeVmWriteAction,
  resolveVmsOptions,
  writeRenderedOutput,
} from './shared.js';

export function createVmsRebootCommand(
  dependencies: VmsCommandDependencies = defaultVmsCommandDependencies,
): Command {
  return applyVmsCommandOptions(new Command('reboot'))
    .argument('<name>', 'VM name')
    .description('Reboot a VM')
    .action(async function handleVmsReboot(name: string) {
      const options = resolveVmsOptions(this);
      const result = await executeVmWriteAction({
        action: 'reboot',
        commandPath: 'vms.reboot',
        mutation: VM_REBOOT_MUTATION,
        name,
        options,
        dependencies,
      });

      writeRenderedOutput(result, options, dependencies);
    });
}
