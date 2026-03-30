# TASK-022: Write Commands: notifications archive|unarchive|delete|create + disks mount|unmount

## Description
Implement notification write commands and disk mount/unmount operations.

## Acceptance Criteria
- [ ] `ucli notifications archive <id> --yes` archives a notification (S1)
- [ ] `ucli notifications archive --all --yes` archives all notifications (S2)
- [ ] `ucli notifications unarchive <id> --yes` unarchives a notification (S1)
- [ ] `ucli notifications unread <id> --yes` marks notification as unread (S1)
- [ ] `ucli notifications delete <id> --yes` deletes a notification (S2)
- [ ] `ucli notifications delete --all --yes --force` deletes all archived notifications (S3)
- [ ] `ucli notifications create --title <t> --message <m> --severity <s> --yes` creates a notification (S1)
- [ ] `ucli disks mount <disk> --yes` mounts a disk (S1)
- [ ] `ucli disks unmount <disk> --yes` unmounts a disk (S2)
- [ ] `ucli disks clear-stats <disk> --yes` clears disk statistics (S2)
- [ ] Safety classifications are correct per action

## Affected Files
- `src/commands/notifications/archive.ts` (new)
- `src/commands/notifications/unarchive.ts` (new)
- `src/commands/notifications/unread.ts` (new)
- `src/commands/notifications/delete.ts` (new)
- `src/commands/notifications/create.ts` (new)
- `src/commands/disks/mount.ts` (new)
- `src/commands/disks/unmount.ts` (new)
- `src/commands/disks/clear-stats.ts` (new)
- `tests/unit/commands/notifications-write.test.ts` (new)
- `tests/unit/commands/disks-write.test.ts` (new)

## Dependencies
- TASK-016 (Notification read commands)
- TASK-013 (Disk read commands)
- TASK-008 (Safety engine)

## Implementation Notes
- Notification mutations: archiveNotification, unarchiveNotifications, unreadNotification, deleteNotification, deleteArchivedNotifications, createNotification
- Disk mutations: ArrayMutations.mountArrayDisk, unmountArrayDisk, clearArrayDiskStatistics
- "delete all" is S3 because it is bulk-destructive
- unmount is S2 because it can interrupt running services

## Validation
- `tests/unit/commands/notifications-write.test.ts` covers notification mutations + safety
- `tests/unit/commands/disks-write.test.ts` covers disk mutations + safety
