import { DOCKER_START_MUTATION, DOCKER_STOP_MUTATION, type DockerStartMutation, type DockerStopMutation } from '../../generated/containers.js';
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
    .argument('<name>', 'Container name')
    .action(async function handleContainersRestart(name: string) {
      const options = resolveContainersOptions(this);
      const localOptions = this.opts<RestartOptions>();

      await assertSafety('containers.restart', {
        yes: localOptions.yes,
        force: localOptions.force,
      });

      const stopResult = await executeDockerMutation<DockerStopMutation>(DOCKER_STOP_MUTATION, name, options, dependencies);
      const startResult = await executeDockerMutation<DockerStartMutation>(DOCKER_START_MUTATION, name, options, dependencies);
      const container = await fetchContainer(name, options, dependencies);

      writeRenderedOutput({
        name: normalizeContainerName(container.name) ?? name,
        state: container.state ?? container.status ?? 'running',
        success: (stopResult.docker.stop?.success ?? true) && (startResult.docker.start?.success ?? true),
        message: startResult.docker.start?.message ?? stopResult.docker.stop?.message ?? null,
      }, options, dependencies);
    });
}
