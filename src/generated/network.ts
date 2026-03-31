import { gql } from '../core/graphql/client.js';

export interface NetworkInterfaceRecord {
  name: string | null;
  status: string | null;
  mac: string | null;
  ipv4: string | null;
  ipv6: string | null;
  mtu: number | null;
  speed: number | null;
}

export interface NetworkRecord {
  hostname: string | null;
  gateway: string | null;
  dns: string[];
  interfaces: NetworkInterfaceRecord[];
}

export interface NetworkQuery {
  network: NetworkRecord;
}

const NETWORK_INTERFACE_FIELDS = gql`
  fragment NetworkInterfaceFields on NetworkInterface {
    name
    status
    mac
    ipv4
    ipv6
    mtu
    speed
  }
`;

const NETWORK_FIELDS = gql`
  ${NETWORK_INTERFACE_FIELDS}

  fragment NetworkFields on Network {
    hostname
    gateway
    dns
    interfaces {
      ...NetworkInterfaceFields
    }
  }
`;

export const NETWORK_QUERY = gql`
  ${NETWORK_FIELDS}

  query Network {
    network {
      ...NetworkFields
    }
  }
`;
