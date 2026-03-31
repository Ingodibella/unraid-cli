import { gql } from '../core/graphql/client.js';

export interface ShareRecord {
  id: string;
  name: string | null;
  free: number | null;
  used: number | null;
  size: number | null;
  include: string[] | null;
  exclude: string[] | null;
  cache: boolean | null;
  nameOrig: string | null;
  comment: string | null;
  floor: string | null;
}

export interface SharesSnapshotQuery {
  shares: ShareRecord[];
}

export const SHARES_SNAPSHOT_QUERY = gql`
  query SharesSnapshot {
    shares {
      id
      name
      free
      used
      size
      include
      exclude
      cache
      nameOrig
      comment
      floor
    }
  }
`;
