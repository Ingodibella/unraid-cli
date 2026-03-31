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
