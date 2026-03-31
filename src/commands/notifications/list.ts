import { Command } from 'commander';
import { applyFilters, applySort } from '../../core/filters/index.js';
import type { NotificationsCommandDependencies } from './shared.js';
import {
  applyNotificationsListOptions,
  defaultNotificationsCommandDependencies,
  fetchNotifications,
  paginateItems,
  resolveNotificationsOptions,
  toNotificationListRecord,
  writeRenderedOutput,
} from './shared.js';

export function createNotificationsListCommand(
  dependencies: NotificationsCommandDependencies = defaultNotificationsCommandDependencies,
): Command {
  return applyNotificationsListOptions(new Command('list'))
    .description('List notifications with severity, timestamp, and read status')
    .action(async function handleNotificationsList() {
      const options = resolveNotificationsOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const notifications = await fetchNotifications(options, dependencies);

      let rows = notifications.map((notification) => toNotificationListRecord(notification));

      if (localOptions.filter) {
        rows = applyFilters(rows, localOptions.filter);
      }

      if (localOptions.sort) {
        rows = applySort(rows, localOptions.sort);
      }

      writeRenderedOutput(paginateItems(rows, options), options, dependencies);
    });
}
