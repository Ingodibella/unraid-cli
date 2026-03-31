import { gql } from '../core/graphql/client.js';

export interface VmRecord {
  id: string;
  name: string | null;
  state: string;
  uuid?: string | null;
}

export interface VmsQuery {
  vms: { domains: VmRecord[] | null; domain: VmRecord[] | null };
}

export interface VmQuery {
  vms: { domains: VmRecord[] | null; domain: VmRecord[] | null };
}

export interface VmQueryVariables {
  id: string;
}

export const VMS_QUERY = gql`
  query Vms {
    vms {
      domains {
        id
        name
        state
      }
      domain {
        id
        name
        state
        uuid
      }
    }
  }
`;

export const VM_QUERY = VMS_QUERY;

export const VM_START_MUTATION = gql`
  mutation VmStart($id: PrefixedID!) {
    vm {
      start(id: $id)
    }
  }
`;
export const VM_STOP_MUTATION = gql`
  mutation VmStop($id: PrefixedID!) {
    vm {
      stop(id: $id)
    }
  }
`;
export const VM_PAUSE_MUTATION = gql`
  mutation VmPause($id: PrefixedID!) {
    vm {
      pause(id: $id)
    }
  }
`;
export const VM_RESUME_MUTATION = gql`
  mutation VmResume($id: PrefixedID!) {
    vm {
      resume(id: $id)
    }
  }
`;
export const VM_REBOOT_MUTATION = gql`
  mutation VmReboot($id: PrefixedID!) {
    vm {
      reboot(id: $id)
    }
  }
`;
export const VM_RESET_MUTATION = gql`
  mutation VmReset($id: PrefixedID!) {
    vm {
      reset(id: $id)
    }
  }
`;
export const VM_FORCE_STOP_MUTATION = gql`
  mutation VmForceStop($id: PrefixedID!) {
    vm {
      forceStop(id: $id)
    }
  }
`;
