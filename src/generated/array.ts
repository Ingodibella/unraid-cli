import { gql } from '../core/graphql/client.js';

export interface ArraySlotDisk {
  idx?: number | null;
  name: string | null;
  device: string | null;
  size: number | null;
  status: string | null;
  rotational?: boolean | null;
  temp: number | null;
  numReads?: number | null;
  numWrites?: number | null;
  numErrors?: number | null;
}

export interface ParityCheck {
  status: string | null;
  progress: number | null;
  errors: number | null;
  running: boolean | null;
  paused: boolean | null;
  correcting: boolean | null;
}

export interface ArrayQuery {
  array: {
    state: string;
    capacity: {
      kilobytes: { free: string; used: string; total: string };
      disks: { free: string; used: string; total: string };
    };
    boot: ArraySlotDisk | null;
    parities: ArraySlotDisk[];
    parityCheckStatus: ParityCheck | null;
    disks: ArraySlotDisk[];
    caches: ArraySlotDisk[];
  };
}

export interface ParityHistoryEntry {
  date: string | null;
  duration: number | null;
  errors: number | null;
  speed: string | null;
  status: string;
}

export interface ParityHistoryQuery {
  parityHistory: ParityHistoryEntry[];
}

export interface ArrayStartMutation {
  array: { startArray: string | null };
}

export interface ArrayStopMutation {
  array: { stopArray: string | null };
}

export interface ParityCheckControlMutation {
  parityCheck: {
    start?: ParityCheck | null;
    pause?: ParityCheck | null;
    resume?: ParityCheck | null;
    cancel?: ParityCheck | null;
  };
}

export const ARRAY_QUERY = gql`
  query ArraySnapshot {
    array {
      state
      capacity {
        kilobytes {
          free
          used
          total
        }
        disks {
          free
          used
          total
        }
      }
      boot {
        name
        device
        size
        status
        temp
      }
      parities {
        idx
        name
        device
        size
        status
        temp
        numErrors
      }
      parityCheckStatus {
        status
        progress
        errors
        running
        paused
        correcting
      }
      disks {
        idx
        name
        device
        size
        status
        rotational
        temp
        numReads
        numWrites
        numErrors
      }
      caches {
        idx
        name
        device
        size
        status
        temp
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

export const ARRAY_START_MUTATION = gql`
  mutation ArrayStart {
    array {
      startArray
    }
  }
`;

export const ARRAY_STOP_MUTATION = gql`
  mutation ArrayStop {
    array {
      stopArray
    }
  }
`;

export const PARITY_CHECK_START_MUTATION = gql`
  mutation ParityCheckStart {
    parityCheck {
      start {
        status
        progress
        errors
        running
        paused
        correcting
      }
    }
  }
`;

export const PARITY_CHECK_PAUSE_MUTATION = gql`
  mutation ParityCheckPause {
    parityCheck {
      pause {
        status
        progress
        errors
        running
        paused
        correcting
      }
    }
  }
`;

export const PARITY_CHECK_RESUME_MUTATION = gql`
  mutation ParityCheckResume {
    parityCheck {
      resume {
        status
        progress
        errors
        running
        paused
        correcting
      }
    }
  }
`;

export const PARITY_CHECK_CANCEL_MUTATION = gql`
  mutation ParityCheckCancel {
    parityCheck {
      cancel {
        status
        progress
        errors
        running
        paused
        correcting
      }
    }
  }
`;
