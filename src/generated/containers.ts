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

export interface DockerMutationResult {
  success: boolean | null;
  message: string | null;
}

export interface DockerStartMutation {
  docker: {
    start: DockerMutationResult | null;
  };
}

export interface DockerStopMutation {
  docker: {
    stop: DockerMutationResult | null;
  };
}

export interface DockerPauseMutation {
  docker: {
    pause: DockerMutationResult | null;
  };
}

export interface DockerUnpauseMutation {
  docker: {
    unpause: DockerMutationResult | null;
  };
}

export interface DockerRemoveMutation {
  docker: {
    removeContainer: DockerMutationResult | null;
  };
}

export type DockerWriteMutationVariables = Record<string, unknown> & {
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

const DOCKER_MUTATION_RESULT_FIELDS = gql`
  fragment DockerMutationResultFields on DockerMutationResult {
    success
    message
  }
`;

export const DOCKER_START_MUTATION = gql`
  ${DOCKER_MUTATION_RESULT_FIELDS}

  mutation DockerStart($name: String!) {
    docker {
      start(name: $name) {
        ...DockerMutationResultFields
      }
    }
  }
`;

export const DOCKER_STOP_MUTATION = gql`
  ${DOCKER_MUTATION_RESULT_FIELDS}

  mutation DockerStop($name: String!) {
    docker {
      stop(name: $name) {
        ...DockerMutationResultFields
      }
    }
  }
`;

export const DOCKER_PAUSE_MUTATION = gql`
  ${DOCKER_MUTATION_RESULT_FIELDS}

  mutation DockerPause($name: String!) {
    docker {
      pause(name: $name) {
        ...DockerMutationResultFields
      }
    }
  }
`;

export const DOCKER_UNPAUSE_MUTATION = gql`
  ${DOCKER_MUTATION_RESULT_FIELDS}

  mutation DockerUnpause($name: String!) {
    docker {
      unpause(name: $name) {
        ...DockerMutationResultFields
      }
    }
  }
`;

export const DOCKER_REMOVE_MUTATION = gql`
  ${DOCKER_MUTATION_RESULT_FIELDS}

  mutation DockerRemoveContainer($name: String!) {
    docker {
      removeContainer(name: $name) {
        ...DockerMutationResultFields
      }
    }
  }
`;
