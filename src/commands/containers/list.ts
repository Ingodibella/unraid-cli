import { Command } from 'commander';
import { applyFilters, applySort } from '../../core/filters/index.js';
import type { ContainersCommandDependencies } from './shared.js';
import {
  applyContainersListOptions,
  defaultContainersCommandDependencies,
  fetchDockerSnapshot,
  formatPorts,
  normalizeContainerName,
  paginateItems,
  resolveContainersOptions,
  writeRenderedOutput,
} from './shared.js';

export interface ContainerListRecord {
  name: string | null;
  image: string | null;
  status: string | null;
  ports: string;
  uptime: string | null;
}

export function createContainersListCommand(
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
): Command {
  return applyContainersListOptions(new Command('list'))
    .description('List all containers with image, status, ports, and uptime')
    .action(async function handleContainersList() {
      const options = resolveContainersOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const snapshot = await fetchDockerSnapshot(options, dependencies);

      let rows = snapshot.docker.containers.map((container) => ({
        name: normalizeContainerName(container.name),
        image: container.image,
        status: container.status,
        ports: formatPorts(container.ports),
        uptime: container.uptime,
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
