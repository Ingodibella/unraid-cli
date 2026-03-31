import { Command } from 'commander';
import { assertSafety } from '../../core/safety/index.js';
import type { NotificationsCommandDependencies } from './shared.js';
import {
  applyNotificationsCommandOptions,
  defaultNotificationsCommandDependencies,
  resolveNotificationsOptions,
  unreadNotification,
  writeRenderedOutput,
} from './shared.js';

export function createNotificationsUnreadCommand(
  dependencies: NotificationsCommandDependencies = defaultNotificationsCommandDependencies,
): Command {
  return applyNotificationsCommandOptions(new Command('unread'))
    .argument('<id>', 'Notification ID')
    .description('Mark one notification as unread')
    .action(async function handleNotificationsUnread(id: string) {
      const options = resolveNotificationsOptions(this);
      const localOptions = this.opts<{ yes?: boolean; force?: boolean }>();

      await assertSafety('notifications.unread', { yes: localOptions.yes, force: localOptions.force });
      await unreadNotification(id, options, dependencies);

      writeRenderedOutput({ action: 'unread', target: id, success: true }, options, dependencies);
    });
}
