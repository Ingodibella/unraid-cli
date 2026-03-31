import { resolveSafetyClass } from './classifier.js';
import { confirmSafetyAction, type PromptAdapter, type TtyLike } from './confirmation.js';

export interface SafetyFlags {
  yes?: boolean;
  force?: boolean;
}

export interface AssertSafetyDependencies {
  stdout?: TtyLike;
  prompt?: PromptAdapter;
}

export async function assertSafety(
  commandPath: string,
  flags: SafetyFlags,
  dependencies: AssertSafetyDependencies = {},
): Promise<void> {
  const safetyClass = resolveSafetyClass(commandPath);

  await confirmSafetyAction({
    safetyClass,
    commandPath,
    yes: flags.yes,
    force: flags.force,
    stdout: dependencies.stdout,
    prompt: dependencies.prompt,
  });
}
