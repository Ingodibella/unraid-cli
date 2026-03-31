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
  writeRenderedOutput,
} from './shared.js';

export interface ContainerStatusRecord {
  name: string | null;
  status: string | null;
  state: string | null;
}

export function createContainersStatusCommand(
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
): Command {
  return applyContainersListOptions(new Command('status'))
    .description('Show running, stopped, and paused container status overview')
    .action(async function handleContainersStatus() {
      const options = resolveContainersOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const snapshot = await fetchDockerSnapshot(options, dependencies);

      let containers = snapshot.docker.containers.map((container) => ({
        name: normalizeContainerName(container.name),
        status: container.status,
        state: container.state,
      } satisfies ContainerStatusRecord));

      if (localOptions.filter) {
        containers = applyFilters(containers, localOptions.filter);
      }

      if (localOptions.sort) {
        containers = applySort(containers, localOptions.sort);
      }

      const summary = snapshot.docker.containers.reduce((counts, container) => {
        const normalized = (container.state ?? container.status ?? 'unknown').toLowerCase();
        if (normalized.includes('run')) {
          counts.running += 1;
        } else if (normalized.includes('pause')) {
          counts.paused += 1;
        } else if (normalized.includes('stop') || normalized.includes('exit')) {
          counts.stopped += 1;
        } else {
          counts.other += 1;
        }
        return counts;
      }, { running: 0, stopped: 0, paused: 0, other: 0 });

      writeRenderedOutput({
        summary,
        containers: paginateItems(containers, options),
      }, options, dependencies);
    });
}
