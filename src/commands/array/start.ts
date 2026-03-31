import { Command } from 'commander';
import { assertSafety } from '../../core/safety/guards.js';
import type { ArrayCommandDependencies } from './shared.js';
import {
  applyArrayCommandOptions,
  defaultArrayCommandDependencies,
  executeArraySetStateMutation,
  resolveArrayOptions,
  writeRenderedOutput,
} from './shared.js';

export interface ArrayStartResult {
  action: 'start';
  state: string | null;
  success: boolean;
  message: string | null;
}

export function createArrayStartCommand(
  dependencies: ArrayCommandDependencies = defaultArrayCommandDependencies,
): Command {
  return applyArrayCommandOptions(new Command('start'))
    .description('Start the array')
    .action(async function handleArrayStart() {
      const options = resolveArrayOptions(this);
      await assertSafety('array.start', { yes: options.yes, force: options.force });

      const mutation = await executeArraySetStateMutation('START', options, dependencies);
      const payload = mutation.array.setState;

      writeRenderedOutput(
        {
          action: 'start',
          state: payload?.state ?? 'STARTED',
          success: payload?.success ?? true,
          message: payload?.message ?? null,
        } satisfies ArrayStartResult,
        options,
        dependencies,
      );
    });
}
