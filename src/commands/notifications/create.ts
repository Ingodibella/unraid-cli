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
    .requiredOption('--subject <subject>', 'Notification subject')
    .requiredOption('--description <description>', 'Notification description')
    .requiredOption('--importance <importance>', 'Notification importance (INFO|WARNING|ALERT)')
    .option('--link <url>', 'Optional link')
    .description('Create a notification')
    .action(async function handleNotificationsCreate() {
      const options = resolveNotificationsOptions(this);
      const localOptions = this.opts<{ title: string; subject: string; description: string; importance: string; link?: string; yes?: boolean; force?: boolean }>();

      await assertSafety('notifications.create', { yes: localOptions.yes, force: localOptions.force });
      const mutation = await createNotification({
        input: {
          title: localOptions.title,
          subject: localOptions.subject,
          description: localOptions.description,
          importance: localOptions.importance.toUpperCase() as 'INFO' | 'WARNING' | 'ALERT',
          ...(localOptions.link ? { link: localOptions.link } : {}),
        },
      }, options, dependencies);

      writeRenderedOutput({ action: 'create', notification: toNotificationListRecord(mutation.createNotification) }, options, dependencies);
    });
}
