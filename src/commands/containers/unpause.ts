import { DOCKER_UNPAUSE_MUTATION, type DockerUnpauseMutation } from '../../generated/containers.js';
import type { ContainersCommandDependencies } from './shared.js';
import { defaultContainersCommandDependencies } from './shared.js';
import { createContainerWriteCommand } from './write-shared.js';

export function createContainersUnpauseCommand(
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
) {
  return createContainerWriteCommand({
    name: 'unpause',
    description: 'Unpause a paused container',
    safetyPath: 'containers.unpause',
    mutation: DOCKER_UNPAUSE_MUTATION,
    expectedState: 'RUNNING',
    extractResult: (result) => (result as DockerUnpauseMutation).docker.unpause,
  }, dependencies);
}
