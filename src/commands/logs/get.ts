import { Command } from 'commander';
import type { LogsCommandDependencies } from './shared.js';
import { applyLogsCommandOptions, defaultLogsCommandDependencies, fetchLogFile, resolveLogsOptions, writeRenderedOutput } from './shared.js';

export function createLogsGetCommand(
  dependencies: LogsCommandDependencies = defaultLogsCommandDependencies,
): Command {
  return applyLogsCommandOptions(new Command('get'))
    .argument('<name-or-path>', 'Log file name or path')
    .description('Show log file content')
    .action(async function handleLogsGet(nameOrPath: string) {
      const options = resolveLogsOptions(this);
      const logFile = await fetchLogFile(nameOrPath, options, dependencies);

      writeRenderedOutput({
        name: logFile.name,
        path: logFile.path,
        size: logFile.size,
        modifiedAt: logFile.modifiedAt,
        content: logFile.content,
      }, options, dependencies);
    });
}
