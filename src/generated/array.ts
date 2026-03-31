import { gql } from '../core/graphql/client.js';

export interface ArrayDisk {
  name: string | null;
  size: number | null;
  status: string | null;
  temperature: number | null;
  filesystem: string | null;
}

export interface ArrayQuery {
  array: {
    state: string | null;
    capacity: number | null;
    used: number | null;
    free: number | null;
    diskCount: number | null;
    disks: ArrayDisk[];
    parity: {
      status: string | null;
      progress: number | null;
      speed: number | null;
      errors: number | null;
    } | null;
  };
}

export interface ParityHistoryEntry {
  date: string | null;
  duration: number | null;
  errors: number | null;
  speed: number | null;
  status: string | null;
}

export interface ParityHistoryQuery {
  parityHistory: ParityHistoryEntry[];
}

export const ARRAY_QUERY = gql`
  query ArraySnapshot {
    array {
      state
      capacity
      used
      free
      diskCount
      disks {
        name
        size
        status
        temperature
        filesystem
      }
      parity {
        status
        progress
        speed
        errors
      }
    }
  }
`;

export const PARITY_HISTORY_QUERY = gql`
  query ParityHistory {
    parityHistory {
      date
      duration
      errors
      speed
      status
    }
  }
`;
