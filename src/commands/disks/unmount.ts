import { Command } from 'commander';
import { assertSafety } from '../../core/safety/index.js';
import type { DisksCommandDependencies } from './shared.js';
import {
  applyDisksCommandOptions,
  defaultDisksCommandDependencies,
  parseDiskIdx,
  resolveDisksOptions,
  unmountDisk,
  writeRenderedOutput,
} from './shared.js';

export function createDisksUnmountCommand(
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): Command {
  return applyDisksCommandOptions(new Command('unmount'))
    .argument('<idx>', 'Disk idx')
    .description('Unmount an array disk by idx')
    .action(async function handleDisksUnmount(idxArg: string) {
      const options = resolveDisksOptions(this);
      const localOptions = this.opts<{ yes?: boolean; force?: boolean }>();
      const idx = parseDiskIdx(idxArg);

      await assertSafety('disks.unmount', { yes: localOptions.yes, force: localOptions.force });
      const mutation = await unmountDisk(idx, options, dependencies);

      writeRenderedOutput({
        action: 'unmount',
        idx,
        success: mutation.array.unmountArrayDisk != null,
        message: mutation.array.unmountArrayDisk ?? null,
      }, options, dependencies);
    });
}
