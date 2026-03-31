import { gql } from '../core/graphql/client.js';

export interface LogFileRecord {
  name: string | null;
  path: string | null;
  size: number | null;
  updatedAt: string | null;
  content: string | null;
}

export interface LogsSnapshotQuery {
  logs: {
    logFiles: LogFileRecord[];
    system: LogFileRecord | null;
  };
}

export interface LogFileQuery {
  logs: {
    logFile: LogFileRecord | null;
  };
}

export type LogFileQueryVariables = Record<string, unknown> & {
  name: string;
};

const LOG_FILE_FIELDS = gql`
  fragment LogFileFields on LogFile {
    name
    path
    size
    updatedAt
    content
  }
`;

export const LOGS_SNAPSHOT_QUERY = gql`
  ${LOG_FILE_FIELDS}

  query LogsSnapshot {
    logs {
      logFiles {
        ...LogFileFields
      }
      system {
        ...LogFileFields
      }
    }
  }
`;

export const LOG_FILE_QUERY = gql`
  ${LOG_FILE_FIELDS}

  query LogFile($name: String!) {
    logs {
      logFile(name: $name) {
        ...LogFileFields
      }
    }
  }
`;
