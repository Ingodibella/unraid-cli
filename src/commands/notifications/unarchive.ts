import { Command } from 'commander';
import { assertSafety } from '../../core/safety/index.js';
import type { NotificationsCommandDependencies } from './shared.js';
import {
  applyNotificationsCommandOptions,
  defaultNotificationsCommandDependencies,
  resolveNotificationsOptions,
  unarchiveNotification,
  writeRenderedOutput,
} from './shared.js';

export function createNotificationsUnarchiveCommand(
  dependencies: NotificationsCommandDependencies = defaultNotificationsCommandDependencies,
): Command {
  return applyNotificationsCommandOptions(new Command('unarchive'))
    .argument('<id>', 'Notification ID')
    .description('Move one notification back to unread')
    .action(async function handleNotificationsUnarchive(id: string) {
      const options = resolveNotificationsOptions(this);
      const localOptions = this.opts<{ yes?: boolean; force?: boolean }>();

      await assertSafety('notifications.unarchive', { yes: localOptions.yes, force: localOptions.force });
      await unarchiveNotification(id, options, dependencies);

      writeRenderedOutput({ action: 'unarchive', target: id, success: true }, options, dependencies);
    });
}
