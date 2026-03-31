import { Command } from 'commander';
import { assertSafety } from '../../core/safety/guards.js';
import type { ParityCheck } from '../../generated/array.js';
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
  progress: number | null;
  errors: number | null;
  running: boolean | null;
  paused: boolean | null;
  correcting: boolean | null;
  warning?: string;
}

function toActionResult(
  action: ParityCheckActionResult['action'],
  payload: ParityCheck | null | undefined,
): ParityCheckActionResult {
  return {
    action,
    status: payload?.status ?? null,
    progress: payload?.progress ?? null,
    errors: payload?.errors ?? null,
    running: payload?.running ?? null,
    paused: payload?.paused ?? null,
    correcting: payload?.correcting ?? null,
  };
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
        writeRenderedOutput(toActionResult('start', mutation.parityCheck.start), options, dependencies);
      }),
  );

  command.addCommand(
    applyArrayCommandOptions(new Command('pause'))
      .description('Pause a running parity check')
      .action(async function handleParityPause() {
        const options = resolveArrayOptions(this);
        await assertSafety('parity.pause', { yes: options.yes, force: options.force });

        const mutation = await executeParityCheckPauseMutation(options, dependencies);
        writeRenderedOutput(toActionResult('pause', mutation.parityCheck.pause), options, dependencies);
      }),
  );

  command.addCommand(
    applyArrayCommandOptions(new Command('resume'))
      .description('Resume a paused parity check')
      .action(async function handleParityResume() {
        const options = resolveArrayOptions(this);
        await assertSafety('parity.resume', { yes: options.yes, force: options.force });

        const mutation = await executeParityCheckResumeMutation(options, dependencies);
        writeRenderedOutput(toActionResult('resume', mutation.parityCheck.resume), options, dependencies);
      }),
  );

  command.addCommand(
    applyArrayCommandOptions(new Command('cancel'))
      .description('Cancel the running parity check')
      .action(async function handleParityCancel() {
        const options = resolveArrayOptions(this);
        await assertSafety('parity.cancel', { yes: options.yes, force: options.force });

        const mutation = await executeParityCheckCancelMutation(options, dependencies);
        const result = toActionResult('cancel', mutation.parityCheck.cancel);
        writeRenderedOutput(
          {
            ...result,
            warning: 'Parity check was cancelled before completion.',
          },
          options,
          dependencies,
        );
      }),
  );

  return command;
}
