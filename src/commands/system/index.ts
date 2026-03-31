import { Command } from 'commander';
import { createSystemHealthCommand } from './health.js';
import { createSystemInfoCommand } from './info.js';
import { createSystemResourcesCommand } from './resources.js';
import { createSystemStatusCommand } from './status.js';
import { createSystemUptimeCommand } from './uptime.js';

export function createSystemCommand(): Command {
  const command = new Command('system')
    .description('Inspect Unraid system information');

  command.addCommand(createSystemInfoCommand());
  command.addCommand(createSystemStatusCommand());
  command.addCommand(createSystemHealthCommand());
  command.addCommand(createSystemUptimeCommand());
  command.addCommand(createSystemResourcesCommand());

  return command;
}
