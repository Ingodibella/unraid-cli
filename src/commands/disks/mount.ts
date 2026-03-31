import { Command } from 'commander';
import { assertSafety } from '../../core/safety/index.js';
import type { DisksCommandDependencies } from './shared.js';
import {
  applyDisksCommandOptions,
  defaultDisksCommandDependencies,
  mountDisk,
  parseDiskIdx,
  resolveDisksOptions,
  writeRenderedOutput,
} from './shared.js';

export function createDisksMountCommand(
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): Command {
  return applyDisksCommandOptions(new Command('mount'))
    .argument('<idx>', 'Disk idx')
    .description('Mount an array disk by idx')
    .action(async function handleDisksMount(idxArg: string) {
      const options = resolveDisksOptions(this);
      const localOptions = this.opts<{ yes?: boolean; force?: boolean }>();
      const idx = parseDiskIdx(idxArg);

      await assertSafety('disks.mount', { yes: localOptions.yes, force: localOptions.force });
      const mutation = await mountDisk(idx, options, dependencies);

      writeRenderedOutput({
        action: 'mount',
        idx,
        success: mutation.array.mountArrayDisk != null,
        message: mutation.array.mountArrayDisk ?? null,
      }, options, dependencies);
    });
}
