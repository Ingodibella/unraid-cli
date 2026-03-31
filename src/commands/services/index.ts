import { Command } from 'commander';
import { createServicesGetCommand } from './get.js';
import { createServicesListCommand } from './list.js';
import { createServicesStatusCommand } from './status.js';

export function createServicesCommand(): Command {
  const command = new Command('services')
    .description('Inspect service status and runtime details');

  command.addCommand(createServicesListCommand());
  command.addCommand(createServicesGetCommand());
  command.addCommand(createServicesStatusCommand());

  return command;
}
