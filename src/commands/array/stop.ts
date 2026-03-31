import { Command } from 'commander';
import { assertSafety } from '../../core/safety/guards.js';
import type { ArrayCommandDependencies } from './shared.js';
import {
  applyArrayCommandOptions,
  defaultArrayCommandDependencies,
  executeArrayStopMutation,
  resolveArrayOptions,
  writeRenderedOutput,
} from './shared.js';

export interface ArrayStopResult {
  action: 'stop';
  state: string | null;
  warning: string;
}

const STOP_WARNING = 'Stopping the array will stop writes and may interrupt running workloads.';

export function createArrayStopCommand(
  dependencies: ArrayCommandDependencies = defaultArrayCommandDependencies,
): Command {
  return applyArrayCommandOptions(new Command('stop'))
    .description('Stop the array')
    .action(async function handleArrayStop() {
      const options = resolveArrayOptions(this);
      await assertSafety('array.stop', { yes: options.yes, force: options.force });

      const mutation = await executeArrayStopMutation(options, dependencies);

      writeRenderedOutput(
        {
          action: 'stop',
          state: mutation.array.stopArray ?? 'STOPPED',
          warning: STOP_WARNING,
        } satisfies ArrayStopResult,
        options,
        dependencies,
      );
    });
}
