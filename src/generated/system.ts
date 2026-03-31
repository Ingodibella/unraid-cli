import { gql } from '../core/graphql/client.js';

export interface InfoQuery {
  info: {
    time: string;
    os: {
      platform: string | null;
      distro: string | null;
      release: string | null;
      hostname: string | null;
      kernel: string | null;
      arch: string | null;
    };
    cpu: {
      manufacturer: string | null;
      brand: string | null;
      cores: number | null;
      threads: number | null;
      speed: number | null;
    };
    memory: {
      layout: Array<{
        size: number | null;
        type: string | null;
      }>;
    };
    versions: {
      core: {
        unraid: string | null;
        api: string | null;
      };
    };
  };
}

export interface ServerQuery {
  server: {
    name: string;
    status: string;
    lanip: string;
  } | null;
}

export interface SystemSnapshotQuery extends InfoQuery, ServerQuery {}

export const SYSTEM_SNAPSHOT_QUERY = gql`
  query SystemSnapshot {
    info {
      time
      os {
        platform
        distro
        release
        hostname
        kernel
        arch
      }
      cpu {
        manufacturer
        brand
        cores
        threads
        speed
      }
      memory {
        layout {
          size
          type
        }
      }
      versions {
        core {
          unraid
          api
        }
      }
    }
    server {
      name
      status
      lanip
    }
  }
`;
