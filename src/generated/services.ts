import { gql } from '../core/graphql/client.js';

export interface ServiceRecord {
  id: string;
  name: string | null;
  online: boolean | null;
  version: string | null;
  uptime: { timestamp: string | null } | null;
}

export interface ServicesQuery {
  services: ServiceRecord[];
}

export interface ServiceQuery {
  services: ServiceRecord[];
}

export interface ServiceQueryVariables {
  name: string;
}

export const SERVICES_QUERY = gql`
  query Services {
    services {
      id
      name
      online
      version
      uptime {
        timestamp
      }
    }
  }
`;

export const SERVICE_QUERY = SERVICES_QUERY;
