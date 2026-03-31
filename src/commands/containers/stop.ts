import { DOCKER_STOP_MUTATION, type DockerStopMutation } from '../../generated/containers.js';
import type { ContainersCommandDependencies } from './shared.js';
import { defaultContainersCommandDependencies } from './shared.js';
import { createContainerWriteCommand } from './write-shared.js';

export function createContainersStopCommand(
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
) {
  return createContainerWriteCommand({
    name: 'stop',
    description: 'Stop a running container',
    safetyPath: 'containers.stop',
    mutation: DOCKER_STOP_MUTATION,
    expectedState: 'stopped',
    extractResult: (result) => (result as DockerStopMutation).docker.stop,
  }, dependencies);
}
