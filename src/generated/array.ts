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

export interface ArraySetStateMutation {
  array: {
    setState: {
      state: string | null;
      success: boolean | null;
      message: string | null;
    } | null;
  };
}

export type ArraySetStateMutationVariables = Record<string, unknown> & {
  state: string;
};

export interface ParityCheckControlMutation {
  parityCheck: {
    start: {
      status: string | null;
      success: boolean | null;
      message: string | null;
    } | null;
    pause: {
      status: string | null;
      success: boolean | null;
      message: string | null;
    } | null;
    resume: {
      status: string | null;
      success: boolean | null;
      message: string | null;
    } | null;
    cancel: {
      status: string | null;
      success: boolean | null;
      message: string | null;
    } | null;
  };
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

export const ARRAY_SET_STATE_MUTATION = gql`
  mutation ArraySetState($state: String!) {
    array {
      setState(state: $state) {
        state
        success
        message
      }
    }
  }
`;

export const PARITY_CHECK_START_MUTATION = gql`
  mutation ParityCheckStart {
    parityCheck {
      start {
        status
        success
        message
      }
    }
  }
`;

export const PARITY_CHECK_PAUSE_MUTATION = gql`
  mutation ParityCheckPause {
    parityCheck {
      pause {
        status
        success
        message
      }
    }
  }
`;

export const PARITY_CHECK_RESUME_MUTATION = gql`
  mutation ParityCheckResume {
    parityCheck {
      resume {
        status
        success
        message
      }
    }
  }
`;

export const PARITY_CHECK_CANCEL_MUTATION = gql`
  mutation ParityCheckCancel {
    parityCheck {
      cancel {
        status
        success
        message
      }
    }
  }
`;
