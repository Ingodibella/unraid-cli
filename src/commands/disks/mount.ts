import { Command } from 'commander';
import { assertSafety } from '../../core/safety/index.js';
import type { DisksCommandDependencies } from './shared.js';
import {
  applyDisksCommandOptions,
  defaultDisksCommandDependencies,
  mountDisk,
  resolveDisksOptions,
  writeRenderedOutput,
} from './shared.js';

export function createDisksMountCommand(
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): Command {
  return applyDisksCommandOptions(new Command('mount'))
    .argument('<disk>', 'Disk name')
    .description('Mount a disk')
    .action(async function handleDisksMount(name: string) {
      const options = resolveDisksOptions(this);
      const localOptions = this.opts<{ yes?: boolean; force?: boolean }>();

      await assertSafety('disks.mount', { yes: localOptions.yes, force: localOptions.force });
      const mutation = await mountDisk(name, options, dependencies);

      writeRenderedOutput({
        action: 'mount',
        name,
        success: mutation.arrayMutations.mountArrayDisk?.success ?? true,
        message: mutation.arrayMutations.mountArrayDisk?.message ?? null,
      }, options, dependencies);
    });
}
