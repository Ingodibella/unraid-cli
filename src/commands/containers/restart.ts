import { DOCKER_START_MUTATION, DOCKER_STOP_MUTATION } from '../../generated/containers.js';
import { assertSafety } from '../../core/safety/index.js';
import type { ContainersCommandDependencies } from './shared.js';
import {
  applyContainersCommandOptions,
  defaultContainersCommandDependencies,
  executeDockerMutation,
  fetchContainer,
  normalizeContainerName,
  resolveContainersOptions,
  writeRenderedOutput,
} from './shared.js';
import { Command } from 'commander';

interface RestartOptions {
  yes?: boolean;
  force?: boolean;
}

export function createContainersRestartCommand(
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
): Command {
  return applyContainersCommandOptions(new Command('restart'))
    .description('Restart a container by stopping then starting it')
    .argument('<container>', 'Container ID or name')
    .action(async function handleContainersRestart(containerArg: string) {
      const options = resolveContainersOptions(this);
      const localOptions = this.opts<RestartOptions>();

      await assertSafety('containers.restart', {
        yes: localOptions.yes,
        force: localOptions.force,
      });

      const target = await fetchContainer(containerArg, options, dependencies);
      await executeDockerMutation(DOCKER_STOP_MUTATION, target.id, options, dependencies);
      await executeDockerMutation(DOCKER_START_MUTATION, target.id, options, dependencies);
      const container = await fetchContainer(target.id, options, dependencies);

      writeRenderedOutput({
        id: target.id,
        name: normalizeContainerName(container.names) ?? containerArg,
        state: container.state,
        success: true,
      }, options, dependencies);
    });
}
