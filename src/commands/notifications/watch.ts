import { Command } from 'commander';
import type { NotificationRecord } from '../../generated/notifications.js';
import type { NotificationsCommandDependencies } from './shared.js';
import {
  applyNotificationsWatchOptions,
  defaultNotificationsCommandDependencies,
  fetchNotifications,
  resolveNotificationsOptions,
  sortByNewest,
  timestampToMillis,
  toNotificationListRecord,
  validateIntervalSeconds,
  writeRenderedOutput,
} from './shared.js';

export function createNotificationsWatchCommand(
  dependencies: NotificationsCommandDependencies = defaultNotificationsCommandDependencies,
): Command {
  return applyNotificationsWatchOptions(new Command('watch'))
    .description('Watch notifications for new entries and stream them continuously')
    .action(async function handleNotificationsWatch() {
      const options = resolveNotificationsOptions(this);
      const localOptions = this.opts<{ interval: number }>();
      validateIntervalSeconds(localOptions.interval);

      const initialNotifications = await fetchNotifications(options, dependencies);
      const seenIds = new Set<string>(
        initialNotifications
          .map((notification) => notification.id)
          .filter((id): id is string => typeof id === 'string' && id.length > 0),
      );
      let lastTimestamp = initialNotifications.reduce((value, notification) => {
        return Math.max(value, timestampToMillis(notification.timestamp));
      }, 0);

      const poll = async (): Promise<void> => {
        try {
          const notifications = await fetchNotifications(options, dependencies);
          const newNotifications = sortByNewest(notifications)
            .reverse()
            .filter((notification) => isNewNotification(notification, seenIds, lastTimestamp));

          for (const notification of newNotifications) {
            if (notification.id != null) {
              seenIds.add(notification.id);
            }
            lastTimestamp = Math.max(lastTimestamp, timestampToMillis(notification.timestamp));
            writeRenderedOutput(toNotificationListRecord(notification), options, dependencies);
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          dependencies.stderrWrite(`Watch poll failed: ${message}\n`);
        }
      };

      const intervalMs = localOptions.interval * 1000;
      const intervalHandle = dependencies.setInterval(() => {
        void poll();
      }, intervalMs);

      await new Promise<void>((resolve) => {
        const stop = (): void => {
          dependencies.clearInterval(intervalHandle);
          dependencies.removeSignalListener('SIGINT', stop);
          resolve();
        };

        dependencies.addSignalListener('SIGINT', stop);
      });
    });
}

function isNewNotification(notification: NotificationRecord, seenIds: Set<string>, lastTimestamp: number): boolean {
  if (notification.id != null && !seenIds.has(notification.id)) {
    return true;
  }

  return timestampToMillis(notification.timestamp) > lastTimestamp;
}
