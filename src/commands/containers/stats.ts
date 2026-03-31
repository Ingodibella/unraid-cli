import { Command } from 'commander';
import { applyFilters, applySort } from '../../core/filters/index.js';
import type { ContainersCommandDependencies } from './shared.js';
import {
  applyContainersListOptions,
  defaultContainersCommandDependencies,
  fetchDockerSnapshot,
  normalizeContainerName,
  paginateItems,
  resolveContainersOptions,
  toStatsRecord,
  writeRenderedOutput,
} from './shared.js';

export function createContainersStatsCommand(
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
): Command {
  return applyContainersListOptions(new Command('stats'))
    .description('Show CPU and memory usage for all containers')
    .action(async function handleContainersStats() {
      const options = resolveContainersOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const snapshot = await fetchDockerSnapshot(options, dependencies);

      let rows = snapshot.docker.containers.map((container) => (
        toStatsRecord(normalizeContainerName(container.name), container.image, container.stats)
      ));

      if (localOptions.filter) {
        rows = applyFilters(rows, localOptions.filter);
      }

      if (localOptions.sort) {
        rows = applySort(rows, localOptions.sort);
      }

      writeRenderedOutput(paginateItems(rows, options), options, dependencies);
    });
}
