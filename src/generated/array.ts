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

export interface ArrayQuery {
  array: {
    state: string;
    capacity: {
      kilobytes: { free: string; used: string; total: string };
      disks: { free: string; used: string; total: string };
    };
    boot: ArraySlotDisk | null;
    parities: ArraySlotDisk[];
    parityCheckStatus: {
      status: string;
      progress: number | null;
      errors: number | null;
      running: boolean | null;
      paused: boolean | null;
    } | null;
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

export interface ArraySetStateMutation {
  array: { setState: { state: string } };
}

export interface ArraySetStateMutationVariables {
  desiredState: 'START' | 'STOP';
}

export interface ParityCheckControlMutation {
  parityCheck: {
    start?: unknown;
    pause?: unknown;
    resume?: unknown;
    cancel?: unknown;
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
      }
      parityCheckStatus {
        status
        progress
        errors
        running
        paused
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

export const ARRAY_SET_STATE_MUTATION = gql`
  mutation ArraySetState($desiredState: ArrayStateInputState!) {
    array {
      setState(input: { desiredState: $desiredState }) {
        state
      }
    }
  }
`;

export const PARITY_CHECK_START_MUTATION = gql`
  mutation ParityCheckStart {
    parityCheck {
      start(correct: false)
    }
  }
`;

export const PARITY_CHECK_PAUSE_MUTATION = gql`
  mutation ParityCheckPause {
    parityCheck {
      pause
    }
  }
`;

export const PARITY_CHECK_RESUME_MUTATION = gql`
  mutation ParityCheckResume {
    parityCheck {
      resume
    }
  }
`;

export const PARITY_CHECK_CANCEL_MUTATION = gql`
  mutation ParityCheckCancel {
    parityCheck {
      cancel
    }
  }
`;
