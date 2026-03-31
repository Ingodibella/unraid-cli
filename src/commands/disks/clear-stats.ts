import { Command } from 'commander';
import { assertSafety } from '../../core/safety/index.js';
import type { DisksCommandDependencies } from './shared.js';
import {
  applyDisksCommandOptions,
  clearDiskStats,
  defaultDisksCommandDependencies,
  parseDiskIdx,
  resolveDisksOptions,
  writeRenderedOutput,
} from './shared.js';

export function createDisksClearStatsCommand(
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): Command {
  return applyDisksCommandOptions(new Command('clear-stats'))
    .argument('<idx>', 'Disk idx')
    .description('Clear disk statistics by idx')
    .action(async function handleDisksClearStats(idxArg: string) {
      const options = resolveDisksOptions(this);
      const localOptions = this.opts<{ yes?: boolean; force?: boolean }>();
      const idx = parseDiskIdx(idxArg);

      await assertSafety('disks.clear-stats', { yes: localOptions.yes, force: localOptions.force });
      const mutation = await clearDiskStats(idx, options, dependencies);

      writeRenderedOutput({
        action: 'clear-stats',
        idx,
        success: mutation.array.clearArrayDiskStatistics ?? false,
        message: null,
      }, options, dependencies);
    });
}
