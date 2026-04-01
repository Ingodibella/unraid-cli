import { Command } from 'commander';
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
  extractResult?: (result: unknown) => unknown;
}

export function createContainerWriteCommand(
  input: CreateContainerWriteCommandInput,
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
): Command {
  return applyContainersCommandOptions(new Command(input.name))
    .description(input.description)
    .argument('<container>', 'Container ID or name')
    .action(async function handleContainerWrite(containerArg: string) {
      const options = resolveContainersOptions(this);
      const mergedOptions = this.optsWithGlobals<WriteCommandOptions>();

      await assertSafety(input.safetyPath, {
        yes: mergedOptions.yes,
        force: mergedOptions.force,
      });

      const target = await fetchContainer(containerArg, options, dependencies);
      await executeDockerMutation<unknown>(input.mutation, target.id, options, dependencies);
      const container = await fetchContainer(target.id, options, dependencies).catch(() => null);

      const normalizedName = normalizeContainerName(container?.names ?? target.names) ?? containerArg;
      const nextState = input.readStateFromContainer === false
        ? input.expectedState
        : normalizeState(container?.state, input.expectedState);

      writeRenderedOutput({
        id: target.id,
        name: normalizedName,
        state: nextState,
        success: true,
      }, options, dependencies);
    });
}

function normalizeState(state: string | null | undefined, fallback: string): string {
  return typeof state === 'string' && state.length > 0 ? state : fallback;
}
