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
    .argument('<name>', 'Container name')
    .description('Show logs for a single container, when the API exposes them')
    .action(async function handleContainersLogs(name: string) {
      const options = resolveContainersOptions(this);
      const container = await fetchContainer(name, options, dependencies);
      writeRenderedOutput({
        name: normalizeContainerName(container.name),
        logs: container.logs ?? '',
      }, options, dependencies);
    });
}
