import { Command } from 'commander';
import type { LogsCommandDependencies } from './shared.js';
import {
  applyLogsCommandOptions,
  defaultLogsCommandDependencies,
  fetchLogsSnapshot,
  resolveLogsOptions,
  writeRenderedOutput,
} from './shared.js';

export function createLogsSystemCommand(
  dependencies: LogsCommandDependencies = defaultLogsCommandDependencies,
): Command {
  return applyLogsCommandOptions(new Command('system'))
    .description('Show system log content')
    .action(async function handleLogsSystem() {
      const options = resolveLogsOptions(this);
      const snapshot = await fetchLogsSnapshot(options, dependencies);
      const systemLog = snapshot.logs.system;

      writeRenderedOutput({
        name: systemLog?.name ?? 'syslog',
        path: systemLog?.path ?? '/var/log/syslog',
        size: systemLog?.size ?? null,
        updatedAt: systemLog?.updatedAt ?? null,
        content: systemLog?.content ?? null,
      }, options, dependencies);
    });
}
