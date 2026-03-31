import { Command } from 'commander';
import type { SharesCommandDependencies } from './shared.js';
import {
  applySharesCommandOptions,
  defaultSharesCommandDependencies,
  fetchShare,
  formatBytes,
  resolveSharesOptions,
  toPercent,
  writeRenderedOutput,
} from './shared.js';

export interface ShareDetailRecord {
  name: string | null;
  type: string | null;
  size: string;
  used: string;
  free: string;
  usedPercent: number | null;
  freePercent: number | null;
  allocation: string | null;
}

export function createSharesGetCommand(
  dependencies: SharesCommandDependencies = defaultSharesCommandDependencies,
): Command {
  return applySharesCommandOptions(new Command('get'))
    .argument('<name>', 'Share name')
    .description('Show detailed information for a single share')
    .action(async function handleSharesGet(name: string) {
      const options = resolveSharesOptions(this);
      const share = await fetchShare(name, options, dependencies);

      writeRenderedOutput({
        name: share.name,
        type: share.type,
        size: formatBytes(share.size),
        used: formatBytes(share.used),
        free: formatBytes(share.free),
        usedPercent: toPercent(share.used, share.size),
        freePercent: toPercent(share.free, share.size),
        allocation: share.allocation,
      } satisfies ShareDetailRecord, options, dependencies);
    });
}
