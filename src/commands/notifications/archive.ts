import { Command } from 'commander';
import { InvalidUsageError } from '../../core/errors/index.js';
import { assertSafety } from '../../core/safety/index.js';
import type { NotificationsCommandDependencies } from './shared.js';
import {
  applyNotificationsCommandOptions,
  archiveAllNotifications,
  archiveNotification,
  defaultNotificationsCommandDependencies,
  resolveNotificationsOptions,
  writeRenderedOutput,
} from './shared.js';

export function createNotificationsArchiveCommand(
  dependencies: NotificationsCommandDependencies = defaultNotificationsCommandDependencies,
): Command {
  return applyNotificationsCommandOptions(new Command('archive'))
    .argument('[id]', 'Notification ID')
    .option('--all', 'Archive all notifications')
    .description('Archive one notification or all notifications')
    .action(async function handleNotificationsArchive(id?: string) {
      const options = resolveNotificationsOptions(this);
      const localOptions = this.opts<{ all?: boolean; yes?: boolean; force?: boolean }>();

      if (localOptions.all) {
        await assertSafety('notifications.archive-all', { yes: localOptions.yes, force: localOptions.force });
        const mutation = await archiveAllNotifications(options, dependencies);
        writeRenderedOutput({
          action: 'archive',
          target: 'all',
          success: mutation.archiveAllNotifications?.success ?? true,
          message: mutation.archiveAllNotifications?.message ?? null,
        }, options, dependencies);
        return;
      }

      if (!id) {
        throw new InvalidUsageError('Notification ID is required when --all is not set.');
      }

      await assertSafety('notifications.archive', { yes: localOptions.yes, force: localOptions.force });
      const mutation = await archiveNotification(id, options, dependencies);
      writeRenderedOutput({
        action: 'archive',
        target: id,
        success: mutation.archiveNotification?.success ?? true,
        message: mutation.archiveNotification?.message ?? null,
      }, options, dependencies);
    });
}
