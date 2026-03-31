import { gql } from '../core/graphql/client.js';

export interface LogFileRecord {
  name: string;
  path: string;
  size: number;
  modifiedAt: string;
}

export interface LogFileContentRecord {
  path: string;
  content: string;
  totalLines: number;
  startLine: number | null;
}

export interface LogsSnapshotQuery {
  logFiles: LogFileRecord[];
}

export interface LogFileQuery {
  logFile: LogFileContentRecord | null;
}

export interface LogFileQueryVariables {
  path: string;
  lines?: number;
  startLine?: number;
}

export const LOGS_SNAPSHOT_QUERY = gql`
  query LogsSnapshot {
    logFiles {
      name
      path
      size
      modifiedAt
    }
  }
`;

export const LOG_FILE_QUERY = gql`
  query LogFile($path: String!, $lines: Int, $startLine: Int) {
    logFile(path: $path, lines: $lines, startLine: $startLine) {
      path
      content
      totalLines
      startLine
    }
  }
`;
