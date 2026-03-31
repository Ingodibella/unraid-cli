import { Command } from 'commander';
import { applyFilters, applySort } from '../../core/filters/index.js';
import type { SharesCommandDependencies } from './shared.js';
import {
  applySharesListOptions,
  defaultSharesCommandDependencies,
  fetchShares,
  formatBytes,
  paginateItems,
  resolveSharesOptions,
  toPercent,
  writeRenderedOutput,
} from './shared.js';

export interface ShareUsageRecord {
  name: string | null;
  type: string | null;
  used: string;
  free: string;
  usedPercent: number | null;
  freePercent: number | null;
}

export function createSharesUsageCommand(
  dependencies: SharesCommandDependencies = defaultSharesCommandDependencies,
): Command {
  return applySharesListOptions(new Command('usage'))
    .description('Show storage utilization across all shares')
    .action(async function handleSharesUsage() {
      const options = resolveSharesOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const shares = await fetchShares(options, dependencies);

      let rows = shares.map((share) => ({
        name: share.name,
        type: share.type,
        used: formatBytes(share.used),
        free: formatBytes(share.free),
        usedPercent: toPercent(share.used, share.size),
        freePercent: toPercent(share.free, share.size),
      } satisfies ShareUsageRecord));

      if (localOptions.filter) {
        rows = applyFilters(rows, localOptions.filter);
      }

      if (localOptions.sort) {
        rows = applySort(rows, localOptions.sort);
      }

      const totals = shares.reduce(
        (acc, share) => {
          acc.size += share.size ?? 0;
          acc.used += share.used ?? 0;
          acc.free += share.free ?? 0;
          return acc;
        },
        { size: 0, used: 0, free: 0 },
      );

      writeRenderedOutput({
        summary: {
          totalShares: shares.length,
          totalSize: formatBytes(totals.size),
          totalUsed: formatBytes(totals.used),
          totalFree: formatBytes(totals.free),
          usedPercent: toPercent(totals.used, totals.size),
          freePercent: toPercent(totals.free, totals.size),
        },
        shares: paginateItems(rows, options),
      }, options, dependencies);
    });
}
