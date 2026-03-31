import { gql } from '../core/graphql/client.js';

export interface DockerPortRecord {
  ip: string | null;
  privatePort: number | null;
  publicPort: number | null;
  type: string;
}

export interface DockerContainerRecord {
  id: string;
  names: string[];
  image: string;
  imageId: string;
  state: string;
  status: string;
  created: number;
  ports: DockerPortRecord[];
  autoStart: boolean;
}

export interface DockerSnapshotQuery {
  docker: {
    containers: DockerContainerRecord[];
  };
}

export interface DockerWriteMutationVariables extends Record<string, unknown> {
  id: string;
}

export interface DockerStartMutation {
  docker: { start: DockerContainerRecord | null };
}
export interface DockerStopMutation {
  docker: { stop: DockerContainerRecord | null };
}
export interface DockerRestartMutation {
  docker: { restart: DockerContainerRecord | null };
}
export interface DockerPauseMutation {
  docker: { pause: DockerContainerRecord | null };
}
export interface DockerUnpauseMutation {
  docker: { unpause: DockerContainerRecord | null };
}
export interface DockerRemoveMutation {
  docker: { remove: boolean };
}

export const DOCKER_SNAPSHOT_QUERY = gql`
  query DockerSnapshot {
    docker {
      containers {
        id
        names
        image
        imageId
        state
        status
        created
        ports {
          ip
          privatePort
          publicPort
          type
        }
        autoStart
      }
    }
  }
`;

export const DOCKER_START_MUTATION = gql`
  mutation DockerStart($id: PrefixedID!) {
    docker {
      start(id: $id) {
        id
        names
        image
        imageId
        state
        status
        created
        autoStart
        ports {
          ip
          privatePort
          publicPort
          type
        }
      }
    }
  }
`;

export const DOCKER_STOP_MUTATION = gql`
  mutation DockerStop($id: PrefixedID!) {
    docker {
      stop(id: $id) {
        id
        names
        image
        imageId
        state
        status
        created
        autoStart
        ports {
          ip
          privatePort
          publicPort
          type
        }
      }
    }
  }
`;

export const DOCKER_PAUSE_MUTATION = gql`
  mutation DockerPause($id: PrefixedID!) {
    docker {
      pause(id: $id) {
        id
        names
        image
        imageId
        state
        status
        created
      }
    }
  }
`;

export const DOCKER_UNPAUSE_MUTATION = gql`
  mutation DockerUnpause($id: PrefixedID!) {
    docker {
      unpause(id: $id) {
        id
        names
        image
        imageId
        state
        status
        created
      }
    }
  }
`;

export const DOCKER_REMOVE_MUTATION = gql`
  mutation DockerRemove($id: PrefixedID!) {
    docker {
      remove(id: $id)
    }
  }
`;
