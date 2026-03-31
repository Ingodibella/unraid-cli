import { Command } from 'commander';
import { assertSafety } from '../../core/safety/index.js';
import type { NotificationsCommandDependencies } from './shared.js';
import {
  applyNotificationsCommandOptions,
  createNotification,
  defaultNotificationsCommandDependencies,
  resolveNotificationsOptions,
  toNotificationListRecord,
  writeRenderedOutput,
} from './shared.js';

export function createNotificationsCreateCommand(
  dependencies: NotificationsCommandDependencies = defaultNotificationsCommandDependencies,
): Command {
  return applyNotificationsCommandOptions(new Command('create'))
    .requiredOption('--title <title>', 'Notification title')
    .requiredOption('--message <message>', 'Notification message')
    .requiredOption('--severity <severity>', 'Notification severity')
    .description('Create a notification')
    .action(async function handleNotificationsCreate() {
      const options = resolveNotificationsOptions(this);
      const localOptions = this.opts<{
        title: string;
        message: string;
        severity: string;
        yes?: boolean;
        force?: boolean;
      }>();

      await assertSafety('notifications.create', { yes: localOptions.yes, force: localOptions.force });
      const mutation = await createNotification({
        title: localOptions.title,
        message: localOptions.message,
        severity: localOptions.severity,
      }, options, dependencies);

      writeRenderedOutput({
        action: 'create',
        notification: mutation.createNotification == null ? null : toNotificationListRecord(mutation.createNotification),
      }, options, dependencies);
    });
}
