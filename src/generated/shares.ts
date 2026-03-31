import { gql } from '../core/graphql/client.js';

export interface ShareRecord {
  name: string | null;
  type: string | null;
  size: number | null;
  used: number | null;
  free: number | null;
  allocation: string | null;
}

export interface SharesSnapshotQuery {
  shares: ShareRecord[];
}

export const SHARES_SNAPSHOT_QUERY = gql`
  query SharesSnapshot {
    shares {
      name
      type
      size
      used
      free
      allocation
    }
  }
`;
