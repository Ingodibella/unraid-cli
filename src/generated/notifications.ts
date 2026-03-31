import { gql } from '../core/graphql/client.js';

export interface NotificationRecord {
  id: string | null;
  title: string | null;
  message: string | null;
  severity: string | null;
  timestamp: string | null;
  read: boolean | null;
}

export interface NotificationsSnapshotQuery {
  notifications: NotificationRecord[];
}

export const NOTIFICATIONS_SNAPSHOT_QUERY = gql`
  query NotificationsSnapshot {
    notifications {
      id
      title
      message
      severity
      timestamp
      read
    }
  }
`;
