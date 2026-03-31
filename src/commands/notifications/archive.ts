import { Command } from 'commander';
import { assertSafety } from '../../core/safety/index.js';
import type { NotificationsCommandDependencies } from './shared.js';
import {
  applyNotificationsCommandOptions,
  archiveNotification,
  defaultNotificationsCommandDependencies,
  resolveNotificationsOptions,
  writeRenderedOutput,
} from './shared.js';

export function createNotificationsArchiveCommand(
  dependencies: NotificationsCommandDependencies = defaultNotificationsCommandDependencies,
): Command {
  return applyNotificationsCommandOptions(new Command('archive'))
    .argument('<id>', 'Notification ID')
    .description('Archive one notification')
    .action(async function handleNotificationsArchive(id: string) {
      const options = resolveNotificationsOptions(this);
      const localOptions = this.opts<{ yes?: boolean; force?: boolean }>();
      await assertSafety('notifications.archive', { yes: localOptions.yes, force: localOptions.force });
      await archiveNotification(id, options, dependencies);
      writeRenderedOutput({ action: 'archive', target: id, success: true }, options, dependencies);
    });
}
