import { gql } from '../core/graphql/client.js';

export interface DockerPortRecord {
  ip: string | null;
  privatePort: number | null;
  publicPort: number | null;
  type: string | null;
}

export interface DockerStatsRecord {
  cpuPercent: number | null;
  memoryUsage: number | null;
  memoryLimit: number | null;
  memoryPercent: number | null;
  networkRx: number | null;
  networkTx: number | null;
  blockRead: number | null;
  blockWrite: number | null;
  pids: number | null;
}

export interface DockerContainerRecord {
  id: string | null;
  name: string | null;
  image: string | null;
  status: string | null;
  state: string | null;
  command: string | null;
  createdAt: string | null;
  startedAt: string | null;
  uptime: string | null;
  ports: DockerPortRecord[];
  logs: string | null;
  inspect: Record<string, unknown> | null;
  stats: DockerStatsRecord | null;
}

export interface DockerSnapshotQuery {
  docker: {
    containers: DockerContainerRecord[];
  };
}

export interface DockerContainerQuery {
  docker: {
    container: DockerContainerRecord | null;
  };
}

export type DockerContainerQueryVariables = Record<string, unknown> & {
  name: string;
};

const DOCKER_CONTAINER_FIELDS = gql`
  fragment DockerContainerFields on DockerContainer {
    id
    name
    image
    status
    state
    command
    createdAt
    startedAt
    uptime
    ports {
      ip
      privatePort
      publicPort
      type
    }
    logs
    inspect
    stats {
      cpuPercent
      memoryUsage
      memoryLimit
      memoryPercent
      networkRx
      networkTx
      blockRead
      blockWrite
      pids
    }
  }
`;

export const DOCKER_SNAPSHOT_QUERY = gql`
  ${DOCKER_CONTAINER_FIELDS}

  query DockerSnapshot {
    docker {
      containers {
        ...DockerContainerFields
      }
    }
  }
`;

export const DOCKER_CONTAINER_QUERY = gql`
  ${DOCKER_CONTAINER_FIELDS}

  query DockerContainer($name: String!) {
    docker {
      container(name: $name) {
        ...DockerContainerFields
      }
    }
  }
`;
