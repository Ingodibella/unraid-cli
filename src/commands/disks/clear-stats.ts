import { Command } from 'commander';
import { assertSafety } from '../../core/safety/index.js';
import type { DisksCommandDependencies } from './shared.js';
import {
  applyDisksCommandOptions,
  clearDiskStats,
  defaultDisksCommandDependencies,
  resolveDisksOptions,
  writeRenderedOutput,
} from './shared.js';

export function createDisksClearStatsCommand(
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): Command {
  return applyDisksCommandOptions(new Command('clear-stats'))
    .argument('<disk>', 'Disk name')
    .description('Clear disk statistics')
    .action(async function handleDisksClearStats(name: string) {
      const options = resolveDisksOptions(this);
      const localOptions = this.opts<{ yes?: boolean; force?: boolean }>();

      await assertSafety('disks.clear-stats', { yes: localOptions.yes, force: localOptions.force });
      const mutation = await clearDiskStats(name, options, dependencies);

      writeRenderedOutput({
        action: 'clear-stats',
        name,
        success: mutation.arrayMutations.clearArrayDiskStatistics?.success ?? true,
        message: mutation.arrayMutations.clearArrayDiskStatistics?.message ?? null,
      }, options, dependencies);
    });
}
