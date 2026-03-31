import { Command } from 'commander';
import { createDisksAssignableCommand } from './assignable.js';
import { createDisksGetCommand } from './get.js';
import { createDisksListCommand } from './list.js';
import { createDisksSmartCommand } from './smart.js';
import { createDisksStatusCommand } from './status.js';
import { createDisksTempCommand } from './temp.js';
import { createDisksUsageCommand } from './usage.js';

export function createDisksCommand(): Command {
  const command = new Command('disks')
    .description('Inspect Unraid disks, SMART data, usage, and temperatures');

  command.addCommand(createDisksListCommand());
  command.addCommand(createDisksGetCommand());
  command.addCommand(createDisksStatusCommand());
  command.addCommand(createDisksSmartCommand());
  command.addCommand(createDisksUsageCommand());
  command.addCommand(createDisksTempCommand());
  command.addCommand(createDisksAssignableCommand());

  return command;
}
