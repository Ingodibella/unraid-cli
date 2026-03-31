import { Command } from 'commander';
import { assertSafety } from '../../core/safety/index.js';
import type { DisksCommandDependencies } from './shared.js';
import {
  applyDisksCommandOptions,
  defaultDisksCommandDependencies,
  resolveDisksOptions,
  unmountDisk,
  writeRenderedOutput,
} from './shared.js';

export function createDisksUnmountCommand(
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): Command {
  return applyDisksCommandOptions(new Command('unmount'))
    .argument('<disk>', 'Disk name')
    .description('Unmount a disk')
    .action(async function handleDisksUnmount(name: string) {
      const options = resolveDisksOptions(this);
      const localOptions = this.opts<{ yes?: boolean; force?: boolean }>();

      await assertSafety('disks.unmount', { yes: localOptions.yes, force: localOptions.force });
      const mutation = await unmountDisk(name, options, dependencies);

      writeRenderedOutput({
        action: 'unmount',
        name,
        success: mutation.arrayMutations.unmountArrayDisk?.success ?? true,
        message: mutation.arrayMutations.unmountArrayDisk?.message ?? null,
      }, options, dependencies);
    });
}
