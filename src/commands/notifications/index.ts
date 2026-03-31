import { Command } from 'commander';
import type { NotificationsCommandDependencies } from './shared.js';
import { createNotificationsArchiveCommand } from './archive.js';
import { createNotificationsCreateCommand } from './create.js';
import { createNotificationsDeleteCommand } from './delete.js';
import { createNotificationsGetCommand } from './get.js';
import { createNotificationsLatestCommand } from './latest.js';
import { createNotificationsListCommand } from './list.js';
import { defaultNotificationsCommandDependencies } from './shared.js';
import { createNotificationsUnarchiveCommand } from './unarchive.js';
import { createNotificationsUnreadCommand } from './unread.js';
import { createNotificationsWatchCommand } from './watch.js';

export function createNotificationsCommand(
  dependencies: NotificationsCommandDependencies = defaultNotificationsCommandDependencies,
): Command {
  const command = new Command('notifications')
    .description('Inspect and stream notification events')
    .addCommand(createNotificationsListCommand(dependencies))
    .addCommand(createNotificationsGetCommand(dependencies))
    .addCommand(createNotificationsLatestCommand(dependencies))
    .addCommand(createNotificationsWatchCommand(dependencies))
    .addCommand(createNotificationsArchiveCommand(dependencies))
    .addCommand(createNotificationsUnarchiveCommand(dependencies))
    .addCommand(createNotificationsUnreadCommand(dependencies))
    .addCommand(createNotificationsDeleteCommand(dependencies))
    .addCommand(createNotificationsCreateCommand(dependencies));

  return command;
}
