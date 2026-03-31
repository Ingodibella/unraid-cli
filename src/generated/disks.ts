import { gql } from '../core/graphql/client.js';

export interface DiskPartition {
  name: string;
  size: number;
  type?: string | null;
  fsType: string;
}

export interface DiskRecord {
  id: string;
  device: string;
  type: string;
  name: string;
  vendor: string;
  size: number;
  bytesPerSector: number;
  totalSectors: number;
  totalHeads: number;
  totalCylinders: number;
  totalTracks: number;
  tracksPerCylinder: number;
  sectorsPerTrack: number;
  firmwareRevision: string;
  serialNum: string;
  interfaceType: string;
  smartStatus: string;
  temperature: number | null;
  partitions: DiskPartition[];
}

export interface DisksQuery {
  disks: DiskRecord[];
}

export interface DiskQuery {
  disk: DiskRecord | null;
}

export interface AssignableDisksQuery {
  assignableDisks: DiskRecord[];
}

export interface DiskQueryVariables {
  id: string;
}

export interface ArrayDiskMutation {
  array: {
    mountArrayDisk?: { id: string } | null;
    unmountArrayDisk?: { id: string } | null;
    clearArrayDiskStatistics?: boolean | null;
  };
}

export interface DiskMutationVariables {
  id: string;
}

const DISK_FIELDS = gql`
  fragment DiskFields on Disk {
    id
    device
    type
    name
    vendor
    size
    bytesPerSector
    totalSectors
    totalHeads
    totalCylinders
    totalTracks
    tracksPerCylinder
    sectorsPerTrack
    firmwareRevision
    serialNum
    interfaceType
    smartStatus
    temperature
    partitions {
      name
      size
      fsType
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
  query Disk($id: PrefixedID!) {
    disk(id: $id) {
      ...DiskFields
    }
  }
`;

export const ASSIGNABLE_DISKS_QUERY = gql`
  ${DISK_FIELDS}
  query AssignableDisks {
    assignableDisks {
      ...DiskFields
    }
  }
`;

export const DISK_MOUNT_MUTATION = gql`
  mutation DiskMount($id: PrefixedID!) {
    array {
      mountArrayDisk(id: $id) {
        id
      }
    }
  }
`;

export const DISK_UNMOUNT_MUTATION = gql`
  mutation DiskUnmount($id: PrefixedID!) {
    array {
      unmountArrayDisk(id: $id) {
        id
      }
    }
  }
`;

export const DISK_CLEAR_STATS_MUTATION = gql`
  mutation DiskClearStats($id: PrefixedID!) {
    array {
      clearArrayDiskStatistics(id: $id)
    }
  }
`;
