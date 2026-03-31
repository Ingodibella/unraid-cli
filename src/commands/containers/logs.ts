import { Command } from 'commander';
import type { ContainersCommandDependencies } from './shared.js';
import {
  applyContainersCommandOptions,
  defaultContainersCommandDependencies,
  fetchContainer,
  normalizeContainerName,
  resolveContainersOptions,
  writeRenderedOutput,
} from './shared.js';

export function createContainersLogsCommand(
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
): Command {
  return applyContainersCommandOptions(new Command('logs'))
    .argument('<container>', 'Container ID or name')
    .description('Show logs availability for a container')
    .action(async function handleContainersLogs(containerArg: string) {
      const options = resolveContainersOptions(this);
      const container = await fetchContainer(containerArg, options, dependencies);
      writeRenderedOutput({
        id: container.id,
        name: normalizeContainerName(container.names),
        logs: null,
        message: 'Logs sind im aktuellen containers Schema nicht enthalten.',
      }, options, dependencies);
    });
}
