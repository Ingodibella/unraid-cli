import { DOCKER_REMOVE_MUTATION } from '../../generated/containers.js';
import type { ContainersCommandDependencies } from './shared.js';
import { defaultContainersCommandDependencies } from './shared.js';
import { createContainerWriteCommand } from './write-shared.js';

export function createContainersRemoveCommand(
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
) {
  return createContainerWriteCommand({
    name: 'remove',
    description: 'Remove a container permanently',
    safetyPath: 'containers.remove',
    mutation: DOCKER_REMOVE_MUTATION,
    expectedState: 'REMOVED',
    readStateFromContainer: false,
  }, dependencies);
}
