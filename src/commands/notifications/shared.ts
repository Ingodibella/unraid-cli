import type { Command } from 'commander';
import { DEFAULTS, OUTPUT_FORMATS, resolveGlobalOptions, type GlobalOptions } from '../../cli/globals.js';
import { resolveAuth } from '../../core/auth/resolver.js';
import { resolveConfig } from '../../core/config/loader.js';
import { InvalidUsageError, NotFoundError } from '../../core/errors/graphql-errors.js';
import { paginate } from '../../core/filters/index.js';
import { createClient, type UcliGraphQLClient } from '../../core/graphql/client.js';
import { renderOutput } from '../../core/output/renderer.js';
import {
  ARCHIVE_NOTIFICATION_MUTATION,
  CREATE_NOTIFICATION_MUTATION,
  DELETE_NOTIFICATION_MUTATION,
  NOTIFICATIONS_SNAPSHOT_QUERY,
  UNREAD_NOTIFICATION_MUTATION,
  type ArchiveNotificationMutation,
  type CreateNotificationMutation,
  type CreateNotificationVariables,
  type DeleteNotificationMutation,
  type DeleteNotificationVariables,
  type NotificationIdVariables,
  type NotificationRecord,
  type NotificationsSnapshotQuery,
  type NotificationsSnapshotVariables,
  type UnreadNotificationMutation,
} from '../../generated/notifications.js';

export interface NotificationsCommandDependencies {
  createGraphQLClient: typeof createClient;
  stdoutWrite: (chunk: string) => boolean;
  stderrWrite: (chunk: string) => boolean;
  setInterval: typeof globalThis.setInterval;
  clearInterval: typeof globalThis.clearInterval;
  addSignalListener: (signal: NodeJS.Signals, listener: () => void) => void;
  removeSignalListener: (signal: NodeJS.Signals, listener: () => void) => void;
}

export const defaultNotificationsCommandDependencies: NotificationsCommandDependencies = {
  createGraphQLClient: createClient,
  stdoutWrite: (chunk: string) => process.stdout.write(chunk),
  stderrWrite: (chunk: string) => process.stderr.write(chunk),
  setInterval: globalThis.setInterval,
  clearInterval: globalThis.clearInterval,
  addSignalListener: (signal, listener) => process.on(signal, listener),
  removeSignalListener: (signal, listener) => process.off(signal, listener),
};

function toGraphQLEndpoint(host: string): string {
  return host.endsWith('/graphql') ? host : `${host.replace(/\/$/, '')}/graphql`;
}

function createNotificationsClient(
  options: GlobalOptions,
  dependencies: NotificationsCommandDependencies = defaultNotificationsCommandDependencies,
): UcliGraphQLClient {
  const resolvedConfig = resolveConfig(options);
  const auth = resolveAuth({
    host: options.host ?? resolvedConfig.host,
    apiKey: options.apiKey ?? resolvedConfig.apiKey,
    profile: options.profile ?? resolvedConfig.profile,
  });

  return dependencies.createGraphQLClient({
    endpoint: toGraphQLEndpoint(auth.host),
    apiKey: auth.apiKey,
    timeout: options.timeout * 1000,
    debug: options.debug,
  });
}

async function fetchNotificationsByType(
  type: 'UNREAD' | 'ARCHIVE',
  options: GlobalOptions,
  dependencies: NotificationsCommandDependencies,
): Promise<NotificationsSnapshotQuery> {
  return createNotificationsClient(options, dependencies).execute<NotificationsSnapshotQuery, NotificationsSnapshotVariables>(
    NOTIFICATIONS_SNAPSHOT_QUERY,
    { filter: { type, offset: 0, limit: 200 } },
  );
}

export async function fetchNotifications(
  options: GlobalOptions,
  dependencies: NotificationsCommandDependencies = defaultNotificationsCommandDependencies,
): Promise<NotificationRecord[]> {
  const [unread, archive] = await Promise.all([
    fetchNotificationsByType('UNREAD', options, dependencies),
    fetchNotificationsByType('ARCHIVE', options, dependencies),
  ]);
  return [...unread.notifications.list, ...archive.notifications.list];
}

export async function fetchNotification(
  id: string,
  options: GlobalOptions,
  dependencies: NotificationsCommandDependencies = defaultNotificationsCommandDependencies,
): Promise<NotificationRecord> {
  const notifications = await fetchNotifications(options, dependencies);
  const notification = notifications.find((entry) => entry.id === id) ?? null;
  if (notification == null) throw new NotFoundError(`Notification not found: ${id}`);
  return notification;
}

export async function archiveNotification(
  id: string,
  options: GlobalOptions,
  dependencies: NotificationsCommandDependencies = defaultNotificationsCommandDependencies,
): Promise<ArchiveNotificationMutation> {
  return createNotificationsClient(options, dependencies).execute<ArchiveNotificationMutation, NotificationIdVariables>(
    ARCHIVE_NOTIFICATION_MUTATION,
    { id },
  );
}

export async function unarchiveNotification(
  id: string,
  options: GlobalOptions,
  dependencies: NotificationsCommandDependencies = defaultNotificationsCommandDependencies,
): Promise<UnreadNotificationMutation> {
  return createNotificationsClient(options, dependencies).execute<UnreadNotificationMutation, NotificationIdVariables>(
    UNREAD_NOTIFICATION_MUTATION,
    { id },
  );
}

export async function unreadNotification(
  id: string,
  options: GlobalOptions,
  dependencies: NotificationsCommandDependencies = defaultNotificationsCommandDependencies,
): Promise<UnreadNotificationMutation> {
  return createNotificationsClient(options, dependencies).execute<UnreadNotificationMutation, NotificationIdVariables>(
    UNREAD_NOTIFICATION_MUTATION,
    { id },
  );
}

export async function deleteNotification(
  id: string,
  type: 'UNREAD' | 'ARCHIVE',
  options: GlobalOptions,
  dependencies: NotificationsCommandDependencies = defaultNotificationsCommandDependencies,
): Promise<DeleteNotificationMutation> {
  return createNotificationsClient(options, dependencies).execute<DeleteNotificationMutation, DeleteNotificationVariables>(
    DELETE_NOTIFICATION_MUTATION,
    { id, type },
  );
}

export async function createNotification(
  variables: CreateNotificationVariables,
  options: GlobalOptions,
  dependencies: NotificationsCommandDependencies = defaultNotificationsCommandDependencies,
): Promise<CreateNotificationMutation> {
  return createNotificationsClient(options, dependencies).execute<CreateNotificationMutation, CreateNotificationVariables>(
    CREATE_NOTIFICATION_MUTATION,
    variables,
  );
}

export function writeRenderedOutput(data: unknown, options: GlobalOptions, dependencies = defaultNotificationsCommandDependencies): void {
  dependencies.stdoutWrite(
    renderOutput(data, {
      format: options.output,
      fields: options.fields,
      noColor: options.noColor,
      quiet: options.quiet,
      verbose: options.verbose,
      stdoutIsTTY: process.stdout.isTTY,
    }),
  );
}

export function applyNotificationsCommandOptions(command: Command): Command {
  return command
    .option('--host <url>', 'Unraid server URL')
    .option('--api-key <key>', 'API key for authentication')
    .option('--profile <name>', 'Configuration profile to use')
    .option('-o, --output <format>', `Output format (${OUTPUT_FORMATS.join(', ')})`, DEFAULTS.output)
    .option('--fields <fields>', 'Comma-separated list of fields to include')
    .option('--timeout <seconds>', 'Request timeout in seconds', Number.parseInt, DEFAULTS.timeout)
    .option('--debug', 'Enable debug output on stderr')
    .option('-v, --verbose', 'Enable verbose output')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--force', 'Allow destructive operations (with --yes for S3)')
    .option('--no-color', 'Disable colored output');
}

export function applyNotificationsListOptions(command: Command): Command {
  return applyNotificationsCommandOptions(command)
    .option('--filter <expr>', 'Filter expression (e.g. importance=ALERT)')
    .option('--sort <expr>', 'Sort expression (e.g. timestamp:desc)')
    .option('--page <number>', 'Page number for paginated results', Number.parseInt)
    .option('--page-size <number>', 'Items per page', Number.parseInt)
    .option('--all', 'Fetch all pages (disable pagination)');
}

export function applyNotificationsLatestOptions(command: Command): Command {
  return applyNotificationsCommandOptions(command).option('--limit <number>', 'Number of notifications to return', Number.parseInt, 10);
}

export function applyNotificationsWatchOptions(command: Command): Command {
  return applyNotificationsCommandOptions(command).option('--interval <seconds>', 'Polling interval in seconds', Number.parseInt, 10);
}

export function resolveNotificationsOptions(command: Command): GlobalOptions {
  const parentOptions = command.parent?.optsWithGlobals() ?? {};
  const localOptions = command.opts();
  return resolveGlobalOptions({ ...parentOptions, ...localOptions });
}

export function paginateItems<T>(items: readonly T[], options: GlobalOptions): T[] {
  return paginate(items, { page: options.page, pageSize: options.pageSize, all: options.all }).items;
}

export function toNotificationListRecord(notification: NotificationRecord): Record<string, unknown> {
  return {
    id: notification.id,
    title: notification.title,
    subject: notification.subject,
    description: notification.description,
    importance: notification.importance,
    type: notification.type,
    timestamp: notification.timestamp,
  };
}

export function timestampToMillis(timestamp: string | null): number {
  if (timestamp == null) return 0;
  const value = Date.parse(timestamp);
  return Number.isFinite(value) ? value : 0;
}

export function sortByNewest(notifications: NotificationRecord[]): NotificationRecord[] {
  return [...notifications].sort((left, right) => timestampToMillis(right.timestamp) - timestampToMillis(left.timestamp));
}

export function validateIntervalSeconds(intervalSeconds: number): void {
  if (!Number.isFinite(intervalSeconds) || intervalSeconds < 1) {
    throw new InvalidUsageError('Watch interval must be at least 1 second.');
  }
}
