import { gql } from '../core/graphql/client.js';

export interface ServiceRecord {
  name: string | null;
  status: string | null;
  enabled: boolean | null;
  pid: number | null;
  uptime: string | null;
  description: string | null;
}

export interface ServicesQuery {
  services: ServiceRecord[];
}

export interface ServiceQuery {
  service: ServiceRecord | null;
}

export type ServiceQueryVariables = Record<string, unknown> & {
  name: string;
};

const SERVICE_FIELDS = gql`
  fragment ServiceFields on Service {
    name
    status
    enabled
    pid
    uptime
    description
  }
`;

export const SERVICES_QUERY = gql`
  ${SERVICE_FIELDS}

  query Services {
    services {
      ...ServiceFields
    }
  }
`;

export const SERVICE_QUERY = gql`
  ${SERVICE_FIELDS}

  query Service($name: String!) {
    service(name: $name) {
      ...ServiceFields
    }
  }
`;
