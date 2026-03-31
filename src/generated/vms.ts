import { gql } from '../core/graphql/client.js';

export interface VmRecord {
  id: string | null;
  name: string | null;
  status: string | null;
  state: string | null;
  vcpus: number | null;
  memory: number | null;
  diskSize: number | null;
  os: string | null;
  autostart: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
  ipAddress: string | null;
  vncPort: number | null;
  inspect: Record<string, unknown> | null;
}

export interface VmsQuery {
  vms: VmRecord[];
}

export interface VmQuery {
  vm: VmRecord | null;
}

export interface VmMutationResult {
  success: boolean | null;
  message: string | null;
}

export interface VmMutations {
  start: VmMutationResult | null;
  stop: VmMutationResult | null;
  pause: VmMutationResult | null;
  resume: VmMutationResult | null;
  reboot: VmMutationResult | null;
  reset: VmMutationResult | null;
  forceStop: VmMutationResult | null;
}

export interface VmMutationsQuery {
  vmMutations: VmMutations;
}

export type VmQueryVariables = Record<string, unknown> & {
  name: string;
};

const VM_FIELDS = gql`
  fragment VmFields on Vm {
    id
    name
    status
    state
    vcpus
    memory
    diskSize
    os
    autostart
    createdAt
    updatedAt
    ipAddress
    vncPort
    inspect
  }
`;

const VM_MUTATION_RESULT_FIELDS = gql`
  fragment VmMutationResultFields on VmMutationResult {
    success
    message
  }
`;

export const VMS_QUERY = gql`
  ${VM_FIELDS}

  query Vms {
    vms {
      ...VmFields
    }
  }
`;

export const VM_QUERY = gql`
  ${VM_FIELDS}

  query Vm($name: String!) {
    vm(name: $name) {
      ...VmFields
    }
  }
`;

export const VM_START_MUTATION = gql`
  ${VM_MUTATION_RESULT_FIELDS}

  mutation VmStart($name: String!) {
    vmMutations {
      start(name: $name) {
        ...VmMutationResultFields
      }
    }
  }
`;

export const VM_STOP_MUTATION = gql`
  ${VM_MUTATION_RESULT_FIELDS}

  mutation VmStop($name: String!) {
    vmMutations {
      stop(name: $name) {
        ...VmMutationResultFields
      }
    }
  }
`;

export const VM_PAUSE_MUTATION = gql`
  ${VM_MUTATION_RESULT_FIELDS}

  mutation VmPause($name: String!) {
    vmMutations {
      pause(name: $name) {
        ...VmMutationResultFields
      }
    }
  }
`;

export const VM_RESUME_MUTATION = gql`
  ${VM_MUTATION_RESULT_FIELDS}

  mutation VmResume($name: String!) {
    vmMutations {
      resume(name: $name) {
        ...VmMutationResultFields
      }
    }
  }
`;

export const VM_REBOOT_MUTATION = gql`
  ${VM_MUTATION_RESULT_FIELDS}

  mutation VmReboot($name: String!) {
    vmMutations {
      reboot(name: $name) {
        ...VmMutationResultFields
      }
    }
  }
`;

export const VM_RESET_MUTATION = gql`
  ${VM_MUTATION_RESULT_FIELDS}

  mutation VmReset($name: String!) {
    vmMutations {
      reset(name: $name) {
        ...VmMutationResultFields
      }
    }
  }
`;

export const VM_FORCE_STOP_MUTATION = gql`
  ${VM_MUTATION_RESULT_FIELDS}

  mutation VmForceStop($name: String!) {
    vmMutations {
      forceStop(name: $name) {
        ...VmMutationResultFields
      }
    }
  }
`;
