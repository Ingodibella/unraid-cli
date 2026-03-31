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

export interface AssignableDisksQuery {
  assignableDisks: DiskRecord[];
}

export interface ArrayDiskTempRecord {
  idx: number | null;
  name: string | null;
  status: string | null;
  temp: number | null;
}

export interface ArrayDisksTempQuery {
  array: {
    disks: ArrayDiskTempRecord[];
  };
}

export interface ArrayDiskMutation {
  array: {
    mountArrayDisk?: string | null;
    unmountArrayDisk?: string | null;
    clearArrayDiskStatistics?: boolean | null;
  };
}

export interface DiskMutationVariables {
  idx: number;
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
    firmwareRevision
    serialNum
    interfaceType
    smartStatus
    temperature
    partitions {
      name
      size
      type
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

export const ASSIGNABLE_DISKS_QUERY = gql`
  ${DISK_FIELDS}
  query AssignableDisks {
    assignableDisks {
      ...DiskFields
    }
  }
`;

export const ARRAY_DISKS_TEMP_QUERY = gql`
  query ArrayDisksTemp {
    array {
      disks {
        idx
        name
        status
        temp
      }
    }
  }
`;

export const DISK_MOUNT_MUTATION = gql`
  mutation DiskMount($idx: Int!) {
    array {
      mountArrayDisk(idx: $idx)
    }
  }
`;

export const DISK_UNMOUNT_MUTATION = gql`
  mutation DiskUnmount($idx: Int!) {
    array {
      unmountArrayDisk(idx: $idx)
    }
  }
`;

export const DISK_CLEAR_STATS_MUTATION = gql`
  mutation DiskClearStats($idx: Int!) {
    array {
      clearArrayDiskStatistics(idx: $idx)
    }
  }
`;
