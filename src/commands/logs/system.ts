import { Command } from 'commander';
import type { LogsCommandDependencies } from './shared.js';
import { applyLogsCommandOptions, defaultLogsCommandDependencies, fetchLogFile, resolveLogsOptions, writeRenderedOutput } from './shared.js';

export function createLogsSystemCommand(
  dependencies: LogsCommandDependencies = defaultLogsCommandDependencies,
): Command {
  return applyLogsCommandOptions(new Command('system'))
    .description('Show system log content')
    .action(async function handleLogsSystem() {
      const options = resolveLogsOptions(this);
      const systemLog = await fetchLogFile('syslog', options, dependencies);

      writeRenderedOutput({
        name: systemLog.name,
        path: systemLog.path,
        size: systemLog.size,
        modifiedAt: systemLog.modifiedAt,
        content: systemLog.content,
      }, options, dependencies);
    });
}
