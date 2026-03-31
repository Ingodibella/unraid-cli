import readline from 'node:readline';
import { ConfirmationCancelledError } from '../errors/index.js';
import { SafetyClass } from './classifier.js';

export interface TtyLike {
  isTTY?: boolean;
}

export type PromptAdapter = (message: string) => Promise<boolean>;

export interface ConfirmSafetyActionOptions {
  safetyClass: SafetyClass;
  commandPath: string;
  yes?: boolean;
  force?: boolean;
  stdout?: TtyLike;
  prompt?: PromptAdapter;
}

export function isInteractiveTty(stdout: TtyLike = process.stdout): boolean {
  return stdout.isTTY === true;
}

export async function confirmSafetyAction(options: ConfirmSafetyActionOptions): Promise<void> {
  const prompt = options.prompt ?? createReadlinePrompt();
  const interactive = isInteractiveTty(options.stdout);

  switch (options.safetyClass) {
    case SafetyClass.S0:
      return;
    case SafetyClass.S1:
      if (options.yes) {
        return;
      }

      if (!interactive) {
        throw new ConfirmationCancelledError(
          `Confirmation required for ${options.commandPath}. Re-run with --yes.`,
        );
      }

      await requirePrompt(prompt, `Confirm reversible action for ${options.commandPath}? [y/N] `);
      return;
    case SafetyClass.S2:
      if (!options.yes) {
        throw new ConfirmationCancelledError(`Critical action ${options.commandPath} requires --yes.`);
      }

      if (interactive) {
        await requirePrompt(
          prompt,
          `Critical action ${options.commandPath} requested with --yes. Press y to continue, anything else to cancel: `,
        );
      }
      return;
    case SafetyClass.S3:
      if (!options.yes || !options.force) {
        throw new ConfirmationCancelledError(
          `Destructive action ${options.commandPath} requires both --yes and --force.`,
        );
      }

      if (interactive) {
        await requirePrompt(
          prompt,
          `Danger: ${options.commandPath} is destructive and cannot be undone. Press y to continue, anything else to cancel: `,
        );
      }
      return;
    default:
      return assertNever(options.safetyClass);
  }
}

async function requirePrompt(prompt: PromptAdapter, message: string): Promise<void> {
  const confirmed = await prompt(message);

  if (!confirmed) {
    throw new ConfirmationCancelledError();
  }
}

function createReadlinePrompt(): PromptAdapter {
  return async (message: string) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      const answer = await new Promise<string>((resolve) => {
        rl.question(message, resolve);
      });

      return /^y(es)?$/i.test(answer.trim());
    } finally {
      rl.close();
    }
  };
}

function assertNever(value: never): never {
  throw new Error(`Unhandled safety class: ${String(value)}`);
}
