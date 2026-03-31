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
  type: string | null;
  size: string;
  used: string;
  free: string;
  allocation: string | null;
}

export function createSharesListCommand(
  dependencies: SharesCommandDependencies = defaultSharesCommandDependencies,
): Command {
  return applySharesListOptions(new Command('list'))
    .description('List all shares with type and allocation details')
    .action(async function handleSharesList() {
      const options = resolveSharesOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const shares = await fetchShares(options, dependencies);

      let rows = shares.map((share) => ({
        name: share.name,
        type: share.type,
        size: formatBytes(share.size),
        used: formatBytes(share.used),
        free: formatBytes(share.free),
        allocation: share.allocation,
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
