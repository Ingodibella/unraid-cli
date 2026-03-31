import { Command } from 'commander';
import { assertSafety } from '../../core/safety/guards.js';
import type { ArrayCommandDependencies } from './shared.js';
import {
  applyArrayCommandOptions,
  defaultArrayCommandDependencies,
  executeArrayStartMutation,
  resolveArrayOptions,
  writeRenderedOutput,
} from './shared.js';

export interface ArrayStartResult {
  action: 'start';
  state: string | null;
}

export function createArrayStartCommand(
  dependencies: ArrayCommandDependencies = defaultArrayCommandDependencies,
): Command {
  return applyArrayCommandOptions(new Command('start'))
    .description('Start the array')
    .action(async function handleArrayStart() {
      const options = resolveArrayOptions(this);
      await assertSafety('array.start', { yes: options.yes, force: options.force });

      const mutation = await executeArrayStartMutation(options, dependencies);

      writeRenderedOutput(
        {
          action: 'start',
          state: mutation.array.startArray ?? 'STARTED',
        } satisfies ArrayStartResult,
        options,
        dependencies,
      );
    });
}
