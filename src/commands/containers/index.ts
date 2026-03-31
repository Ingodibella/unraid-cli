import { Command } from 'commander';
import { createContainersGetCommand } from './get.js';
import { createContainersInspectCommand } from './inspect.js';
import { createContainersListCommand } from './list.js';
import { createContainersLogsCommand } from './logs.js';
import { createContainersStatsCommand } from './stats.js';
import { createContainersStatusCommand } from './status.js';

export function createContainersCommand(): Command {
  const command = new Command('containers')
    .description('Inspect Docker containers, status, logs, and runtime statistics');

  command.addCommand(createContainersListCommand());
  command.addCommand(createContainersGetCommand());
  command.addCommand(createContainersStatusCommand());
  command.addCommand(createContainersInspectCommand());
  command.addCommand(createContainersLogsCommand());
  command.addCommand(createContainersStatsCommand());

  return command;
}
