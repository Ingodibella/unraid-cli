import { Command } from 'commander';
import type { NotificationsCommandDependencies } from './shared.js';
import { createNotificationsGetCommand } from './get.js';
import { createNotificationsLatestCommand } from './latest.js';
import { createNotificationsListCommand } from './list.js';
import { defaultNotificationsCommandDependencies } from './shared.js';
import { createNotificationsWatchCommand } from './watch.js';

export function createNotificationsCommand(
  dependencies: NotificationsCommandDependencies = defaultNotificationsCommandDependencies,
): Command {
  const command = new Command('notifications')
    .description('Inspect and stream notification events')
    .addCommand(createNotificationsListCommand(dependencies))
    .addCommand(createNotificationsGetCommand(dependencies))
    .addCommand(createNotificationsLatestCommand(dependencies))
    .addCommand(createNotificationsWatchCommand(dependencies));

  return command;
}
