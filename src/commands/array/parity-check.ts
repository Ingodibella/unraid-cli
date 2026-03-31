import { Command } from 'commander';
import { assertSafety } from '../../core/safety/guards.js';
import type { ArrayCommandDependencies } from './shared.js';
import {
  applyArrayCommandOptions,
  defaultArrayCommandDependencies,
  executeParityCheckCancelMutation,
  executeParityCheckPauseMutation,
  executeParityCheckResumeMutation,
  executeParityCheckStartMutation,
  resolveArrayOptions,
  writeRenderedOutput,
} from './shared.js';

export interface ParityCheckActionResult {
  action: 'start' | 'pause' | 'resume' | 'cancel';
  status: string | null;
  success: boolean;
  message: string | null;
  warning?: string;
}

export function createParityCheckCommand(
  dependencies: ArrayCommandDependencies = defaultArrayCommandDependencies,
): Command {
  const command = new Command('check').description('Control parity check lifecycle');

  command.addCommand(
    applyArrayCommandOptions(new Command('start'))
      .description('Start a parity check')
      .action(async function handleParityStart() {
        const options = resolveArrayOptions(this);
        await assertSafety('parity.start', { yes: options.yes, force: options.force });

        const mutation = await executeParityCheckStartMutation(options, dependencies);
        const payload = mutation.parityCheck.start;

        writeRenderedOutput(
          {
            action: 'start',
            status: payload?.status ?? 'running',
            success: payload?.success ?? true,
            message: payload?.message ?? null,
          } satisfies ParityCheckActionResult,
          options,
          dependencies,
        );
      }),
  );

  command.addCommand(
    applyArrayCommandOptions(new Command('pause'))
      .description('Pause a running parity check')
      .action(async function handleParityPause() {
        const options = resolveArrayOptions(this);
        await assertSafety('parity.pause', { yes: options.yes, force: options.force });

        const mutation = await executeParityCheckPauseMutation(options, dependencies);
        const payload = mutation.parityCheck.pause;

        writeRenderedOutput(
          {
            action: 'pause',
            status: payload?.status ?? 'paused',
            success: payload?.success ?? true,
            message: payload?.message ?? null,
          } satisfies ParityCheckActionResult,
          options,
          dependencies,
        );
      }),
  );

  command.addCommand(
    applyArrayCommandOptions(new Command('resume'))
      .description('Resume a paused parity check')
      .action(async function handleParityResume() {
        const options = resolveArrayOptions(this);
        await assertSafety('parity.resume', { yes: options.yes, force: options.force });

        const mutation = await executeParityCheckResumeMutation(options, dependencies);
        const payload = mutation.parityCheck.resume;

        writeRenderedOutput(
          {
            action: 'resume',
            status: payload?.status ?? 'running',
            success: payload?.success ?? true,
            message: payload?.message ?? null,
          } satisfies ParityCheckActionResult,
          options,
          dependencies,
        );
      }),
  );

  command.addCommand(
    applyArrayCommandOptions(new Command('cancel'))
      .description('Cancel the running parity check')
      .action(async function handleParityCancel() {
        const options = resolveArrayOptions(this);
        await assertSafety('parity.cancel', { yes: options.yes, force: options.force });

        const mutation = await executeParityCheckCancelMutation(options, dependencies);
        const payload = mutation.parityCheck.cancel;

        writeRenderedOutput(
          {
            action: 'cancel',
            status: payload?.status ?? 'cancelled',
            success: payload?.success ?? true,
            message: payload?.message ?? null,
            warning: 'Parity check was cancelled before completion.',
          } satisfies ParityCheckActionResult,
          options,
          dependencies,
        );
      }),
  );

  return command;
}
