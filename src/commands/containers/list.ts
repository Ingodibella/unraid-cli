import { Command } from 'commander';
import { applyFilters, applySort } from '../../core/filters/index.js';
import type { ContainersCommandDependencies } from './shared.js';
import {
  applyContainersListOptions,
  defaultContainersCommandDependencies,
  fetchDockerSnapshot,
  formatContainerNames,
  formatPorts,
  paginateItems,
  resolveContainersOptions,
  writeRenderedOutput,
} from './shared.js';

export interface ContainerListRecord {
  id: string;
  names: string;
  image: string;
  state: string;
  status: string;
  ports: string;
}

export function createContainersListCommand(
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
): Command {
  return applyContainersListOptions(new Command('list'))
    .description('List all containers with image and current runtime state')
    .action(async function handleContainersList() {
      const options = resolveContainersOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const snapshot = await fetchDockerSnapshot(options, dependencies);

      let rows = snapshot.docker.containers.map((container) => ({
        id: container.id,
        names: formatContainerNames(container.names),
        image: container.image,
        state: container.state,
        status: container.status,
        ports: formatPorts(container.ports),
      } satisfies ContainerListRecord));

      if (localOptions.filter) {
        rows = applyFilters(rows, localOptions.filter);
      }

      if (localOptions.sort) {
        rows = applySort(rows, localOptions.sort);
      }

      writeRenderedOutput(paginateItems(rows, options), options, dependencies);
    });
}
