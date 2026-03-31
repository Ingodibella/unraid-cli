import { Command } from 'commander';
import type { NotificationsCommandDependencies } from './shared.js';
import {
  applyNotificationsLatestOptions,
  defaultNotificationsCommandDependencies,
  fetchNotifications,
  resolveNotificationsOptions,
  sortByNewest,
  toNotificationListRecord,
  writeRenderedOutput,
} from './shared.js';

export function createNotificationsLatestCommand(
  dependencies: NotificationsCommandDependencies = defaultNotificationsCommandDependencies,
): Command {
  return applyNotificationsLatestOptions(new Command('latest'))
    .description('Show the latest notifications sorted by timestamp descending')
    .action(async function handleNotificationsLatest() {
      const options = resolveNotificationsOptions(this);
      const localOptions = this.opts<{ limit: number }>();
      const notifications = await fetchNotifications(options, dependencies);
      const latest = sortByNewest(notifications)
        .slice(0, Math.max(0, localOptions.limit))
        .map((notification) => toNotificationListRecord(notification));

      writeRenderedOutput(latest, options, dependencies);
    });
}
