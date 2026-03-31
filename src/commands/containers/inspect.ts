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
    .argument('<name>', 'Container name')
    .description('Show the raw inspect payload for a single container')
    .action(async function handleContainersInspect(name: string) {
      const options = resolveContainersOptions(this);
      const container = await fetchContainer(name, options, dependencies);
      writeRenderedOutput(container.inspect ?? {}, options, dependencies);
    });
}
