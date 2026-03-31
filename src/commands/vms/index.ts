import { Command } from 'commander';
import { createVmsGetCommand } from './get.js';
import { createVmsInspectCommand } from './inspect.js';
import { createVmsListCommand } from './list.js';
import { createVmsStatusCommand } from './status.js';

export function createVmsCommand(): Command {
  const command = new Command('vms')
    .description('Inspect virtual machines, status, and details');

  command.addCommand(createVmsListCommand());
  command.addCommand(createVmsGetCommand());
  command.addCommand(createVmsStatusCommand());
  command.addCommand(createVmsInspectCommand());

  return command;
}
