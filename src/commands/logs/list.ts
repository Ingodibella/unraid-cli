import { Command } from 'commander';
import { applyFilters, applySort } from '../../core/filters/index.js';
import type { LogsCommandDependencies } from './shared.js';
import {
  applyLogsListOptions,
  defaultLogsCommandDependencies,
  fetchLogsSnapshot,
  paginateItems,
  resolveLogsOptions,
  writeRenderedOutput,
} from './shared.js';

export function createLogsListCommand(
  dependencies: LogsCommandDependencies = defaultLogsCommandDependencies,
): Command {
  return applyLogsListOptions(new Command('list'))
    .description('List available log files')
    .action(async function handleLogsList() {
      const options = resolveLogsOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const snapshot = await fetchLogsSnapshot(options, dependencies);

      let rows = snapshot.logs.logFiles.map((logFile) => ({
        name: logFile.name,
        path: logFile.path,
        size: logFile.size,
        updatedAt: logFile.updatedAt,
      }));

      if (localOptions.filter) {
        rows = applyFilters(rows, localOptions.filter);
      }

      if (localOptions.sort) {
        rows = applySort(rows, localOptions.sort);
      }

      writeRenderedOutput(paginateItems(rows, options), options, dependencies);
    });
}
