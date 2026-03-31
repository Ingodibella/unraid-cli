import { Command } from 'commander';
import { createVmsForceStopCommand } from './force-stop.js';
import { createVmsGetCommand } from './get.js';
import { createVmsInspectCommand } from './inspect.js';
import { createVmsListCommand } from './list.js';
import { createVmsPauseCommand } from './pause.js';
import { createVmsRebootCommand } from './reboot.js';
import { createVmsResetCommand } from './reset.js';
import { createVmsResumeCommand } from './resume.js';
import { createVmsStartCommand } from './start.js';
import { createVmsStatusCommand } from './status.js';
import { createVmsStopCommand } from './stop.js';

export function createVmsCommand(): Command {
  const command = new Command('vms')
    .description('Inspect and control virtual machines, status, and details');

  command.addCommand(createVmsListCommand());
  command.addCommand(createVmsGetCommand());
  command.addCommand(createVmsStatusCommand());
  command.addCommand(createVmsInspectCommand());
  command.addCommand(createVmsStartCommand());
  command.addCommand(createVmsStopCommand());
  command.addCommand(createVmsPauseCommand());
  command.addCommand(createVmsResumeCommand());
  command.addCommand(createVmsRebootCommand());
  command.addCommand(createVmsResetCommand());
  command.addCommand(createVmsForceStopCommand());

  return command;
}
