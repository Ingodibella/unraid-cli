import { Command } from 'commander';
import { createDisksAssignableCommand } from './assignable.js';
import { createDisksClearStatsCommand } from './clear-stats.js';
import { createDisksGetCommand } from './get.js';
import { createDisksListCommand } from './list.js';
import { createDisksMountCommand } from './mount.js';
import { createDisksSmartCommand } from './smart.js';
import { createDisksStatusCommand } from './status.js';
import { createDisksTempCommand } from './temp.js';
import { createDisksUnmountCommand } from './unmount.js';
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
  command.addCommand(createDisksMountCommand());
  command.addCommand(createDisksUnmountCommand());
  command.addCommand(createDisksClearStatsCommand());

  return command;
}
