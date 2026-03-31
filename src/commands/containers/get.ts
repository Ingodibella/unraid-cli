import { Command } from 'commander';
import type { ContainersCommandDependencies } from './shared.js';
import {
  applyContainersCommandOptions,
  defaultContainersCommandDependencies,
  fetchContainer,
  formatContainerNames,
  formatPorts,
  normalizeContainerName,
  resolveContainersOptions,
  writeRenderedOutput,
} from './shared.js';

export interface ContainerDetailRecord {
  id: string;
  name: string | null;
  names: string;
  image: string;
  imageId: string;
  state: string;
  status: string;
  created: number;
  autoStart: boolean;
  ports: string;
}

export function createContainersGetCommand(
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
): Command {
  return applyContainersCommandOptions(new Command('get'))
    .argument('<container>', 'Container ID or name')
    .description('Show details for a single container')
    .action(async function handleContainersGet(containerArg: string) {
      const options = resolveContainersOptions(this);
      const container = await fetchContainer(containerArg, options, dependencies);

      writeRenderedOutput({
        id: container.id,
        name: normalizeContainerName(container.names),
        names: formatContainerNames(container.names),
        image: container.image,
        imageId: container.imageId,
        state: container.state,
        status: container.status,
        created: container.created,
        autoStart: container.autoStart,
        ports: formatPorts(container.ports),
      } satisfies ContainerDetailRecord, options, dependencies);
    });
}
