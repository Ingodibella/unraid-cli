import { Command } from 'commander';
import { assertSafety } from '../../core/safety/index.js';
import type { NotificationsCommandDependencies } from './shared.js';
import {
  applyNotificationsCommandOptions,
  defaultNotificationsCommandDependencies,
  deleteNotification,
  fetchNotification,
  resolveNotificationsOptions,
  writeRenderedOutput,
} from './shared.js';

export function createNotificationsDeleteCommand(
  dependencies: NotificationsCommandDependencies = defaultNotificationsCommandDependencies,
): Command {
  return applyNotificationsCommandOptions(new Command('delete'))
    .argument('<id>', 'Notification ID')
    .description('Delete one notification')
    .action(async function handleNotificationsDelete(id: string) {
      const options = resolveNotificationsOptions(this);
      const localOptions = this.opts<{ yes?: boolean; force?: boolean }>();

      await assertSafety('notifications.delete-one', { yes: localOptions.yes, force: localOptions.force });
      const notification = await fetchNotification(id, options, dependencies);
      await deleteNotification(id, notification.type, options, dependencies);

      writeRenderedOutput({ action: 'delete', target: id, success: true }, options, dependencies);
    });
}
