import { Command } from 'commander';
import { createContainersGetCommand } from './get.js';
import { createContainersInspectCommand } from './inspect.js';
import { createContainersListCommand } from './list.js';
import { createContainersLogsCommand } from './logs.js';
import { createContainersStatsCommand } from './stats.js';
import { createContainersStatusCommand } from './status.js';
import { createContainersStartCommand } from './start.js';
import { createContainersStopCommand } from './stop.js';
import { createContainersRestartCommand } from './restart.js';
import { createContainersPauseCommand } from './pause.js';
import { createContainersUnpauseCommand } from './unpause.js';
import { createContainersRemoveCommand } from './remove.js';

export function createContainersCommand(): Command {
  const command = new Command('containers')
    .description('Inspect Docker containers, status, logs, and runtime statistics');

  command.addCommand(createContainersListCommand());
  command.addCommand(createContainersGetCommand());
  command.addCommand(createContainersStatusCommand());
  command.addCommand(createContainersInspectCommand());
  command.addCommand(createContainersLogsCommand());
  command.addCommand(createContainersStatsCommand());
  command.addCommand(createContainersStartCommand());
  command.addCommand(createContainersStopCommand());
  command.addCommand(createContainersRestartCommand());
  command.addCommand(createContainersPauseCommand());
  command.addCommand(createContainersUnpauseCommand());
  command.addCommand(createContainersRemoveCommand());

  return command;
}
