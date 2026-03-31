import { gql } from '../core/graphql/client.js';

export interface NetworkInterfaceRecord {
  name: string;
  description: string | null;
  macAddress: string | null;
  status: string | null;
  protocol: string | null;
  ipAddress: string | null;
  netmask: string | null;
}

export interface NetworkQuery {
  network: {
    id: string;
    accessUrls: Array<{
      ipv4: string | null;
      ipv6: string | null;
      type: string;
      name: string | null;
    }> | null;
  };
  info: {
    networkInterfaces: NetworkInterfaceRecord[];
  };
}

export const NETWORK_QUERY = gql`
  query Network {
    network {
      id
      accessUrls {
        ipv4
        ipv6
        type
        name
      }
    }
    info {
      networkInterfaces {
        name
        description
        macAddress
        status
        protocol
        ipAddress
        netmask
      }
    }
  }
`;
