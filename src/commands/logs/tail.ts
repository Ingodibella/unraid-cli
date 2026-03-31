import { Command } from 'commander';
import type { LogsCommandDependencies } from './shared.js';
import {
  applyLogsCommandOptions,
  defaultLogsCommandDependencies,
  fetchLogFile,
  resolveLogsOptions,
  tailLines,
  writeRenderedOutput,
} from './shared.js';

export function createLogsTailCommand(
  dependencies: LogsCommandDependencies = defaultLogsCommandDependencies,
): Command {
  return applyLogsCommandOptions(new Command('tail'))
    .argument('<name>', 'Log file name')
    .option('-n, --lines <count>', 'Number of lines from end of file', (value: string) => Number.parseInt(value, 10), 50)
    .description('Show the last N lines from a log file')
    .action(async function handleLogsTail(name: string) {
      const options = resolveLogsOptions(this);
      const localOptions = this.opts<{ lines: number }>();
      const logFile = await fetchLogFile(name, options, dependencies);

      writeRenderedOutput({
        name: logFile.name,
        lines: localOptions.lines,
        content: tailLines(logFile.content, localOptions.lines),
      }, options, dependencies);
    });
}
