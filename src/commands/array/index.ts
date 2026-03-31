import { Command } from 'commander';
import { createArrayDevicesCommand } from './devices.js';
import { createParityCommand } from './parity.js';
import { createArrayShowCommand } from './show.js';
import { createArrayStartCommand } from './start.js';
import { createArrayStatusCommand } from './status.js';
import { createArrayStopCommand } from './stop.js';

export function createArrayCommand(): Command {
  const command = new Command('array')
    .description('Inspect Unraid array state, disks, and parity');

  command.addCommand(createArrayShowCommand());
  command.addCommand(createArrayStatusCommand());
  command.addCommand(createArrayDevicesCommand());
  command.addCommand(createArrayStartCommand());
  command.addCommand(createArrayStopCommand());
  command.addCommand(createParityCommand());

  return command;
}
