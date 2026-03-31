import { Command } from 'commander';
import { createNetworkInterfacesCommand } from './interfaces.js';
import { createNetworkStatusCommand } from './status.js';

export function createNetworkCommand(): Command {
  const command = new Command('network')
    .description('Inspect network status and interfaces');

  command.addCommand(createNetworkStatusCommand());
  command.addCommand(createNetworkInterfacesCommand());

  return command;
}
