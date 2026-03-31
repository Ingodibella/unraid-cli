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
  id: string;
  name: string | null;
  size: string;
  used: string;
  free: string;
  usedPercent: number | null;
  freePercent: number | null;
  include: string[] | null;
  exclude: string[] | null;
  cache: boolean | null;
  nameOrig: string | null;
  comment: string | null;
  floor: string | null;
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
        id: share.id,
        name: share.name,
        size: formatBytes(share.size),
        used: formatBytes(share.used),
        free: formatBytes(share.free),
        usedPercent: toPercent(share.used, share.size),
        freePercent: toPercent(share.free, share.size),
        include: share.include,
        exclude: share.exclude,
        cache: share.cache,
        nameOrig: share.nameOrig,
        comment: share.comment,
        floor: share.floor,
      } satisfies ShareDetailRecord, options, dependencies);
    });
}
