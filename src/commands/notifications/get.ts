import { Command } from 'commander';
import type { NotificationsCommandDependencies } from './shared.js';
import {
  applyNotificationsCommandOptions,
  defaultNotificationsCommandDependencies,
  fetchNotification,
  resolveNotificationsOptions,
  toNotificationListRecord,
  writeRenderedOutput,
} from './shared.js';

export function createNotificationsGetCommand(
  dependencies: NotificationsCommandDependencies = defaultNotificationsCommandDependencies,
): Command {
  return applyNotificationsCommandOptions(new Command('get'))
    .argument('<id>', 'Notification ID')
    .description('Show detailed information for a single notification')
    .action(async function handleNotificationsGet(id: string) {
      const options = resolveNotificationsOptions(this);
      const notification = await fetchNotification(id, options, dependencies);
      writeRenderedOutput(toNotificationListRecord(notification), options, dependencies);
    });
}
