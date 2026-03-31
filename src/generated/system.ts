import { gql } from '../core/graphql/client.js';

export interface InfoQuery {
  info: {
    osPlatform: string | null;
    distro: string | null;
    release: string | null;
    hostname: string | null;
    uptime: number | null;
  };
}

export interface ServerQuery {
  server: {
    state: string | null;
    dockerRunning: boolean | null;
    vmRunning: boolean | null;
    cpuUsage: number | null;
    memoryUsage: number | null;
    memoryTotal: number | null;
    storageUsed: number | null;
    storageTotal: number | null;
    cacheUsage: number | null;
    parityStatus: string | null;
    parityProgress: number | null;
    temps: {
      cpu: number | null;
      motherboard: number | null;
      array: number | null;
    } | null;
    disks: Array<{
      name: string | null;
      status: string | null;
      temperature: number | null;
    }>;
  };
}

export interface SystemSnapshotQuery extends InfoQuery, ServerQuery {}

export const SYSTEM_SNAPSHOT_QUERY = gql`
  query SystemSnapshot {
    info {
      osPlatform
      distro
      release
      hostname
      uptime
    }
    server {
      state
      dockerRunning
      vmRunning
      cpuUsage
      memoryUsage
      memoryTotal
      storageUsed
      storageTotal
      cacheUsage
      parityStatus
      parityProgress
      temps {
        cpu
        motherboard
        array
      }
      disks {
        name
        status
        temperature
      }
    }
  }
`;
