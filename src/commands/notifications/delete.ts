import { Command } from 'commander';
import { InvalidUsageError } from '../../core/errors/index.js';
import { assertSafety } from '../../core/safety/index.js';
import type { NotificationsCommandDependencies } from './shared.js';
import {
  applyNotificationsCommandOptions,
  defaultNotificationsCommandDependencies,
  deleteArchivedNotifications,
  deleteNotification,
  resolveNotificationsOptions,
  writeRenderedOutput,
} from './shared.js';

export function createNotificationsDeleteCommand(
  dependencies: NotificationsCommandDependencies = defaultNotificationsCommandDependencies,
): Command {
  return applyNotificationsCommandOptions(new Command('delete'))
    .argument('[id]', 'Notification ID')
    .option('--all', 'Delete all archived notifications')
    .description('Delete one notification or all archived notifications')
    .action(async function handleNotificationsDelete(id?: string) {
      const options = resolveNotificationsOptions(this);
      const localOptions = this.opts<{ all?: boolean; yes?: boolean; force?: boolean }>();

      if (localOptions.all) {
        await assertSafety('notifications.delete', { yes: localOptions.yes, force: localOptions.force });
        const mutation = await deleteArchivedNotifications(options, dependencies);

        writeRenderedOutput({
          action: 'delete',
          target: 'all-archived',
          success: mutation.deleteArchivedNotifications?.success ?? true,
          message: mutation.deleteArchivedNotifications?.message ?? null,
        }, options, dependencies);
        return;
      }

      if (!id) {
        throw new InvalidUsageError('Notification ID is required when --all is not set.');
      }

      await assertSafety('notifications.delete-one', { yes: localOptions.yes, force: localOptions.force });
      const mutation = await deleteNotification(id, options, dependencies);

      writeRenderedOutput({
        action: 'delete',
        target: id,
        success: mutation.deleteNotification?.success ?? true,
        message: mutation.deleteNotification?.message ?? null,
      }, options, dependencies);
    });
}
