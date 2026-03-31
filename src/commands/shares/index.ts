import { Command } from 'commander';
import type { SharesCommandDependencies } from './shared.js';
import { createSharesGetCommand } from './get.js';
import { createSharesListCommand } from './list.js';
import { defaultSharesCommandDependencies } from './shared.js';
import { createSharesUsageCommand } from './usage.js';

export function createSharesCommand(
  dependencies: SharesCommandDependencies = defaultSharesCommandDependencies,
): Command {
  return new Command('shares')
    .description('Inspect shares and storage usage')
    .addCommand(createSharesListCommand(dependencies))
    .addCommand(createSharesGetCommand(dependencies))
    .addCommand(createSharesUsageCommand(dependencies));
}
