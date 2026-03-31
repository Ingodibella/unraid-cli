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

export interface NotificationMutationResult {
  success: boolean | null;
  message: string | null;
}

export interface ArchiveNotificationMutation {
  archiveNotification: NotificationMutationResult | null;
}

export interface ArchiveAllNotificationsMutation {
  archiveAllNotifications: NotificationMutationResult | null;
}

export interface UnarchiveNotificationMutation {
  unarchiveNotification: NotificationMutationResult | null;
}

export interface UnreadNotificationMutation {
  unreadNotification: NotificationMutationResult | null;
}

export interface DeleteNotificationMutation {
  deleteNotification: NotificationMutationResult | null;
}

export interface DeleteArchivedNotificationsMutation {
  deleteArchivedNotifications: NotificationMutationResult | null;
}

export interface CreateNotificationMutation {
  createNotification: NotificationRecord | null;
}

export type NotificationIdVariables = Record<string, unknown> & {
  id: string;
};

export type CreateNotificationVariables = Record<string, unknown> & {
  title: string;
  message: string;
  severity: string;
};

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

export const ARCHIVE_NOTIFICATION_MUTATION = gql`
  mutation ArchiveNotification($id: String!) {
    archiveNotification(id: $id) {
      success
      message
    }
  }
`;

export const ARCHIVE_ALL_NOTIFICATIONS_MUTATION = gql`
  mutation ArchiveAllNotifications {
    archiveAllNotifications {
      success
      message
    }
  }
`;

export const UNARCHIVE_NOTIFICATION_MUTATION = gql`
  mutation UnarchiveNotification($id: String!) {
    unarchiveNotification(id: $id) {
      success
      message
    }
  }
`;

export const UNREAD_NOTIFICATION_MUTATION = gql`
  mutation UnreadNotification($id: String!) {
    unreadNotification(id: $id) {
      success
      message
    }
  }
`;

export const DELETE_NOTIFICATION_MUTATION = gql`
  mutation DeleteNotification($id: String!) {
    deleteNotification(id: $id) {
      success
      message
    }
  }
`;

export const DELETE_ARCHIVED_NOTIFICATIONS_MUTATION = gql`
  mutation DeleteArchivedNotifications {
    deleteArchivedNotifications {
      success
      message
    }
  }
`;

export const CREATE_NOTIFICATION_MUTATION = gql`
  mutation CreateNotification($title: String!, $message: String!, $severity: String!) {
    createNotification(title: $title, message: $message, severity: $severity) {
      id
      title
      message
      severity
      timestamp
      read
    }
  }
`;
