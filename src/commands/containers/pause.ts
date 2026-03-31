import { DOCKER_PAUSE_MUTATION, type DockerPauseMutation } from '../../generated/containers.js';
import type { ContainersCommandDependencies } from './shared.js';
import { defaultContainersCommandDependencies } from './shared.js';
import { createContainerWriteCommand } from './write-shared.js';

export function createContainersPauseCommand(
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
) {
  return createContainerWriteCommand({
    name: 'pause',
    description: 'Pause a running container',
    safetyPath: 'containers.pause',
    mutation: DOCKER_PAUSE_MUTATION,
    expectedState: 'paused',
    extractResult: (result) => (result as DockerPauseMutation).docker.pause,
  }, dependencies);
}
