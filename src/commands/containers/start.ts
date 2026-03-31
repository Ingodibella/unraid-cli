import { DOCKER_START_MUTATION, type DockerStartMutation } from '../../generated/containers.js';
import type { ContainersCommandDependencies } from './shared.js';
import { defaultContainersCommandDependencies } from './shared.js';
import { createContainerWriteCommand } from './write-shared.js';

export function createContainersStartCommand(
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
) {
  return createContainerWriteCommand({
    name: 'start',
    description: 'Start a stopped container',
    safetyPath: 'containers.start',
    mutation: DOCKER_START_MUTATION,
    expectedState: 'running',
    extractResult: (result) => (result as DockerStartMutation).docker.start,
  }, dependencies);
}
