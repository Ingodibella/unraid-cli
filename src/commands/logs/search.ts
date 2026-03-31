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

export function createLogsSearchCommand(
  dependencies: LogsCommandDependencies = defaultLogsCommandDependencies,
): Command {
  return applyLogsListOptions(new Command('search'))
    .requiredOption('--query <term>', 'Search term')
    .description('Search all log files and system log for a term')
    .action(async function handleLogsSearch() {
      const options = resolveLogsOptions(this);
      const localOptions = this.opts<{ query: string; filter?: string; sort?: string }>();
      const snapshot = await fetchLogsSnapshot(options, dependencies);
      const needle = localOptions.query.toLowerCase();

      let matches = [
        ...snapshot.logs.logFiles,
        ...(snapshot.logs.system == null ? [] : [snapshot.logs.system]),
      ]
        .map((logFile) => ({
          name: logFile.name,
          path: logFile.path,
          matchCount: (logFile.content ?? '').toLowerCase().split(needle).length - 1,
          excerpt: (logFile.content ?? '').split(/\r?\n/).find((line) => line.toLowerCase().includes(needle)) ?? null,
        }))
        .filter((entry) => entry.matchCount > 0);

      if (localOptions.filter) {
        matches = applyFilters(matches, localOptions.filter);
      }

      if (localOptions.sort) {
        matches = applySort(matches, localOptions.sort);
      }

      writeRenderedOutput(paginateItems(matches, options), options, dependencies);
    });
}
