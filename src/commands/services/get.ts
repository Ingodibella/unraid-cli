import { Command } from 'commander';
import type { ServicesCommandDependencies } from './shared.js';
import {
  applyServicesCommandOptions,
  defaultServicesCommandDependencies,
  fetchService,
  resolveServicesOptions,
  writeRenderedOutput,
} from './shared.js';

export function createServicesGetCommand(
  dependencies: ServicesCommandDependencies = defaultServicesCommandDependencies,
): Command {
  return applyServicesCommandOptions(new Command('get'))
    .argument('<id-or-name>', 'Service id or name')
    .description('Show detailed information for one service')
    .action(async function handleServicesGet(idOrName: string) {
      const options = resolveServicesOptions(this);
      const service = await fetchService(idOrName, options, dependencies);
      writeRenderedOutput(service, options, dependencies);
    });
}
