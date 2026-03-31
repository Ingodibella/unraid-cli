import { gql } from '../core/graphql/client.js';

export interface NotificationRecord {
  id: string;
  title: string;
  subject: string;
  description: string;
  importance: 'ALERT' | 'INFO' | 'WARNING';
  link: string | null;
  type: 'UNREAD' | 'ARCHIVE';
  timestamp: string | null;
}

export interface NotificationsSnapshotQuery {
  notifications: {
    overview: {
      unread: { info: number; warning: number; alert: number; total: number };
      archive: { info: number; warning: number; alert: number; total: number };
    };
    list: NotificationRecord[];
  };
}

export interface NotificationIdVariables { id: string; type?: 'UNREAD' | 'ARCHIVE'; }
export interface CreateNotificationVariables {
  input: {
    title: string;
    subject: string;
    description: string;
    importance: 'ALERT' | 'INFO' | 'WARNING';
    link?: string;
  };
}

export interface ArchiveNotificationMutation { archiveNotification: NotificationRecord; }
export interface ArchiveAllNotificationsMutation { archiveAll: NotificationsSnapshotQuery['notifications']['overview']; }
export interface UnarchiveNotificationMutation { unarchiveNotifications: NotificationsSnapshotQuery['notifications']['overview']; }
export interface UnreadNotificationMutation { unreadNotification: NotificationRecord; }
export interface DeleteNotificationMutation { deleteNotification: NotificationsSnapshotQuery['notifications']['overview']; }
export interface DeleteArchivedNotificationsMutation { deleteArchivedNotifications: NotificationsSnapshotQuery['notifications']['overview']; }
export interface CreateNotificationMutation { createNotification: NotificationRecord; }

export const NOTIFICATIONS_SNAPSHOT_QUERY = gql`
  query NotificationsSnapshot($filter: NotificationFilter!) {
    notifications {
      overview {
        unread {
          info
          warning
          alert
          total
        }
        archive {
          info
          warning
          alert
          total
        }
      }
      list(filter: $filter) {
        id
        title
        subject
        description
        importance
        link
        type
        timestamp
      }
    }
  }
`;

export const ARCHIVE_NOTIFICATION_MUTATION = gql`
  mutation ArchiveNotification($id: PrefixedID!) {
    archiveNotification(id: $id) {
      id
      title
      subject
      description
      importance
      link
      type
      timestamp
    }
  }
`;

export const ARCHIVE_ALL_NOTIFICATIONS_MUTATION = gql`
  mutation ArchiveAllNotifications {
    archiveAll {
      unread {
        info
        warning
        alert
        total
      }
      archive {
        info
        warning
        alert
        total
      }
    }
  }
`;

export const UNARCHIVE_NOTIFICATION_MUTATION = gql`
  mutation UnarchiveNotification($id: PrefixedID!) {
    unarchiveNotifications(ids: [$id]) {
      unread {
        info
        warning
        alert
        total
      }
      archive {
        info
        warning
        alert
        total
      }
    }
  }
`;

export const UNREAD_NOTIFICATION_MUTATION = gql`
  mutation UnreadNotification($id: PrefixedID!) {
    unreadNotification(id: $id) {
      id
      title
      subject
      description
      importance
      link
      type
      timestamp
    }
  }
`;

export const DELETE_NOTIFICATION_MUTATION = gql`
  mutation DeleteNotification($id: PrefixedID!, $type: NotificationType!) {
    deleteNotification(id: $id, type: $type) {
      unread {
        info
        warning
        alert
        total
      }
      archive {
        info
        warning
        alert
        total
      }
    }
  }
`;

export const DELETE_ARCHIVED_NOTIFICATIONS_MUTATION = gql`
  mutation DeleteArchivedNotifications {
    deleteArchivedNotifications {
      unread {
        info
        warning
        alert
        total
      }
      archive {
        info
        warning
        alert
        total
      }
    }
  }
`;

export const CREATE_NOTIFICATION_MUTATION = gql`
  mutation CreateNotification($input: NotificationData!) {
    createNotification(input: $input) {
      id
      title
      subject
      description
      importance
      link
      type
      timestamp
    }
  }
`;
