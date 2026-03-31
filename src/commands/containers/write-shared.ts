import { Command } from 'commander';
import { assertSafety } from '../../core/safety/index.js';
import type { DockerContainerRecord, DockerMutationResult } from '../../generated/containers.js';
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

interface WriteCommandOptions {
  yes?: boolean;
  force?: boolean;
}

interface CreateContainerWriteCommandInput {
  name: string;
  description: string;
  safetyPath: string;
  mutation: string;
  expectedState: string;
  readStateFromContainer?: boolean;
  extractResult: (result: unknown) => DockerMutationResult | null;
}

export function createContainerWriteCommand(
  input: CreateContainerWriteCommandInput,
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
): Command {
  return applyContainersCommandOptions(new Command(input.name))
    .description(input.description)
    .argument('<name>', 'Container name')
    .action(async function handleContainerWrite(name: string) {
      const options = resolveContainersOptions(this);
      const localOptions = this.opts<WriteCommandOptions>();

      await assertSafety(input.safetyPath, {
        yes: localOptions.yes,
        force: localOptions.force,
      });

      const mutationData = await executeDockerMutation<unknown>(input.mutation, name, options, dependencies);
      const mutationResult = input.extractResult(mutationData);
      const container = await fetchContainer(name, options, dependencies).catch(() => null);

      const normalizedName = normalizeContainerName(container?.name ?? name) ?? name;
      const nextState = input.readStateFromContainer === false
        ? input.expectedState
        : normalizeState(container, input.expectedState);

      writeRenderedOutput({
        name: normalizedName,
        state: nextState,
        success: mutationResult?.success ?? true,
        message: mutationResult?.message ?? null,
      }, options, dependencies);
    });
}

function normalizeState(container: DockerContainerRecord | null, fallback: string): string {
  const state = container?.state ?? container?.status;
  return typeof state === 'string' && state.length > 0 ? state : fallback;
}
