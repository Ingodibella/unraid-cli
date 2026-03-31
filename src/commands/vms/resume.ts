import { Command } from 'commander';
import { VM_RESUME_MUTATION } from '../../generated/vms.js';
import type { VmsCommandDependencies } from './shared.js';
import {
  applyVmsCommandOptions,
  defaultVmsCommandDependencies,
  executeVmWriteAction,
  resolveVmsOptions,
  writeRenderedOutput,
} from './shared.js';

export function createVmsResumeCommand(
  dependencies: VmsCommandDependencies = defaultVmsCommandDependencies,
): Command {
  return applyVmsCommandOptions(new Command('resume'))
    .argument('<id-or-name>', 'VM id or name')
    .description('Resume a paused VM')
    .action(async function handleVmsResume(idOrName: string) {
      const options = resolveVmsOptions(this);
      const result = await executeVmWriteAction({
        action: 'resume',
        commandPath: 'vms.resume',
        mutation: VM_RESUME_MUTATION,
        idOrName,
        options,
        dependencies,
      });

      writeRenderedOutput(result, options, dependencies);
    });
}
