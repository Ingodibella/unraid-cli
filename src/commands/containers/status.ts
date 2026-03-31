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
  id: string;
  name: string | null;
  state: string;
  status: string;
}

export function createContainersStatusCommand(
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
): Command {
  return applyContainersListOptions(new Command('status'))
    .description('Show container state overview')
    .action(async function handleContainersStatus() {
      const options = resolveContainersOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const snapshot = await fetchDockerSnapshot(options, dependencies);

      let containers = snapshot.docker.containers.map((container) => ({
        id: container.id,
        name: normalizeContainerName(container.names),
        state: container.state,
        status: container.status,
      } satisfies ContainerStatusRecord));

      if (localOptions.filter) {
        containers = applyFilters(containers, localOptions.filter);
      }

      if (localOptions.sort) {
        containers = applySort(containers, localOptions.sort);
      }

      const summary = snapshot.docker.containers.reduce((counts, container) => {
        const normalized = String(container.state).toUpperCase();
        if (normalized === 'RUNNING') {
          counts.running += 1;
        } else if (normalized === 'PAUSED') {
          counts.paused += 1;
        } else if (normalized === 'EXITED') {
          counts.exited += 1;
        } else {
          counts.other += 1;
        }
        return counts;
      }, { running: 0, paused: 0, exited: 0, other: 0 });

      writeRenderedOutput({
        summary,
        containers: paginateItems(containers, options),
      }, options, dependencies);
    });
}
