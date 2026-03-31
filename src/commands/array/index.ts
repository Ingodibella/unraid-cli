import { Command } from 'commander';
import { createArrayDevicesCommand } from './devices.js';
import { createParityCommand } from './parity.js';
import { createArrayShowCommand } from './show.js';
import { createArrayStatusCommand } from './status.js';

export function createArrayCommand(): Command {
  const command = new Command('array')
    .description('Inspect Unraid array state, disks, and parity');

  command.addCommand(createArrayShowCommand());
  command.addCommand(createArrayStatusCommand());
  command.addCommand(createArrayDevicesCommand());
  command.addCommand(createParityCommand());

  return command;
}
