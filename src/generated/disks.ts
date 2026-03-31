import { gql } from '../core/graphql/client.js';

export interface DiskSmartAttribute {
  id: number | null;
  name: string | null;
  value: number | null;
  worst: number | null;
  threshold: number | null;
  raw: string | null;
  status: string | null;
}

export interface DiskRecord {
  name: string | null;
  device: string | null;
  size: number | null;
  used: number | null;
  free: number | null;
  status: string | null;
  temperature: number | null;
  type: string | null;
  filesystem: string | null;
  serial: string | null;
  model: string | null;
  smartStatus: string | null;
  smartAttributes: DiskSmartAttribute[];
}

export interface DisksQuery {
  disks: DiskRecord[];
}

export interface DiskQuery {
  disk: DiskRecord | null;
}

export interface AssignableDiskRecord {
  name: string | null;
  device: string | null;
  size: number | null;
  status: string | null;
  type: string | null;
  filesystem: string | null;
}

export interface AssignableDisksQuery {
  assignableDisks: AssignableDiskRecord[];
}

export type DiskQueryVariables = Record<string, unknown> & {
  name: string;
};

export interface DiskMutationResult {
  success: boolean | null;
  message: string | null;
}

export interface ArrayDiskMutation {
  arrayMutations: {
    mountArrayDisk: DiskMutationResult | null;
    unmountArrayDisk: DiskMutationResult | null;
    clearArrayDiskStatistics: DiskMutationResult | null;
  };
}

export type DiskMutationVariables = Record<string, unknown> & {
  name: string;
};

const DISK_FIELDS = gql`
  fragment DiskFields on Disk {
    name
    device
    size
    used
    free
    status
    temperature
    type
    filesystem
    serial
    model
    smartStatus
    smartAttributes {
      id
      name
      value
      worst
      threshold
      raw
      status
    }
  }
`;

export const DISKS_QUERY = gql`
  ${DISK_FIELDS}

  query DisksSnapshot {
    disks {
      ...DiskFields
    }
  }
`;

export const DISK_QUERY = gql`
  ${DISK_FIELDS}

  query Disk($name: String!) {
    disk(name: $name) {
      ...DiskFields
    }
  }
`;

export const ASSIGNABLE_DISKS_QUERY = gql`
  query AssignableDisks {
    assignableDisks {
      name
      device
      size
      status
      type
      filesystem
    }
  }
`;

export const DISK_MOUNT_MUTATION = gql`
  mutation DiskMount($name: String!) {
    arrayMutations {
      mountArrayDisk(name: $name) {
        success
        message
      }
    }
  }
`;

export const DISK_UNMOUNT_MUTATION = gql`
  mutation DiskUnmount($name: String!) {
    arrayMutations {
      unmountArrayDisk(name: $name) {
        success
        message
      }
    }
  }
`;

export const DISK_CLEAR_STATS_MUTATION = gql`
  mutation DiskClearStats($name: String!) {
    arrayMutations {
      clearArrayDiskStatistics(name: $name) {
        success
        message
      }
    }
  }
`;
