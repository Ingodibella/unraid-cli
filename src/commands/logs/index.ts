import { Command } from 'commander';
import { createLogsGetCommand } from './get.js';
import { createLogsListCommand } from './list.js';
import { createLogsSearchCommand } from './search.js';
import { createLogsSystemCommand } from './system.js';
import { createLogsTailCommand } from './tail.js';

export function createLogsCommand(): Command {
  const command = new Command('logs')
    .description('Inspect Unraid log files, syslog output, and log search results');

  command.addCommand(createLogsListCommand());
  command.addCommand(createLogsGetCommand());
  command.addCommand(createLogsTailCommand());
  command.addCommand(createLogsSystemCommand());
  command.addCommand(createLogsSearchCommand());

  return command;
}
