import { gql } from '../core/graphql/client.js';

export type NotificationType = 'UNREAD' | 'ARCHIVE';
export type NotificationImportance = 'ALERT' | 'INFO' | 'WARNING';

export interface NotificationRecord {
  id: string;
  title: string;
  subject: string;
  description: string;
  importance: NotificationImportance;
  link: string | null;
  type: NotificationType;
  timestamp: string | null;
}

export interface NotificationOverviewCounters {
  info: number;
  warning: number;
  alert: number;
  total: number;
}

export interface NotificationsSnapshotQuery {
  notifications: {
    overview: {
      unread: NotificationOverviewCounters;
      archive: NotificationOverviewCounters;
    };
    list: NotificationRecord[];
  };
}

export interface NotificationsSnapshotVariables {
  filter: {
    importance?: NotificationImportance;
    type: NotificationType;
    offset: number;
    limit: number;
  };
}

export interface NotificationIdVariables {
  id: string;
}

export interface DeleteNotificationVariables {
  id: string;
  type: NotificationType;
}

export interface CreateNotificationVariables {
  input: {
    title: string;
    subject: string;
    description: string;
    importance: NotificationImportance;
    link?: string;
  };
}

export interface ArchiveNotificationMutation { archiveNotification: NotificationRecord; }
export interface UnreadNotificationMutation { unreadNotification: NotificationRecord; }
export interface DeleteNotificationMutation { deleteNotification: { unread: NotificationOverviewCounters; archive: NotificationOverviewCounters }; }
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
