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
  writeRenderedOutput,
} from './shared.js';

export interface ShareListRecord {
  name: string | null;
  size: string;
  used: string;
  free: string;
  cache: boolean | null;
  floor: string | null;
}

export function createSharesListCommand(
  dependencies: SharesCommandDependencies = defaultSharesCommandDependencies,
): Command {
  return applySharesListOptions(new Command('list'))
    .description('List all shares with size and cache policy details')
    .action(async function handleSharesList() {
      const options = resolveSharesOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const shares = await fetchShares(options, dependencies);

      let rows = shares.map((share) => ({
        name: share.name,
        size: formatBytes(share.size),
        used: formatBytes(share.used),
        free: formatBytes(share.free),
        cache: share.cache,
        floor: share.floor,
      } satisfies ShareListRecord));

      if (localOptions.filter) {
        rows = applyFilters(rows, localOptions.filter);
      }

      if (localOptions.sort) {
        rows = applySort(rows, localOptions.sort);
      }

      writeRenderedOutput(paginateItems(rows, options), options, dependencies);
    });
}
