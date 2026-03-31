import { Command } from 'commander';
import type { ContainersCommandDependencies } from './shared.js';
import {
  applyContainersCommandOptions,
  defaultContainersCommandDependencies,
  fetchContainer,
  resolveContainersOptions,
  writeRenderedOutput,
} from './shared.js';

export function createContainersInspectCommand(
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
): Command {
  return applyContainersCommandOptions(new Command('inspect'))
    .argument('<container>', 'Container ID or name')
    .description('Show the raw container payload from the Docker list query')
    .action(async function handleContainersInspect(containerArg: string) {
      const options = resolveContainersOptions(this);
      const container = await fetchContainer(containerArg, options, dependencies);
      writeRenderedOutput(container, options, dependencies);
    });
}
