import { Command } from 'commander';
import type { LogsCommandDependencies } from './shared.js';
import {
  applyLogsCommandOptions,
  defaultLogsCommandDependencies,
  fetchLogFile,
  resolveLogsOptions,
  writeRenderedOutput,
} from './shared.js';

export function createLogsGetCommand(
  dependencies: LogsCommandDependencies = defaultLogsCommandDependencies,
): Command {
  return applyLogsCommandOptions(new Command('get'))
    .argument('<name>', 'Log file name')
    .description('Show log file content by name')
    .action(async function handleLogsGet(name: string) {
      const options = resolveLogsOptions(this);
      const logFile = await fetchLogFile(name, options, dependencies);

      writeRenderedOutput({
        name: logFile.name,
        path: logFile.path,
        size: logFile.size,
        updatedAt: logFile.updatedAt,
        content: logFile.content,
      }, options, dependencies);
    });
}
