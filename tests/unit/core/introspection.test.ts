import { mkdtemp, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UcliGraphQLClient } from '../../../src/core/graphql/client.js';
import {
  DEFAULT_INTROSPECTION_QUERY,
  fetchSchemaIntrospection,
  loadSchemaSnapshot,
  saveSchemaSnapshot,
  type IntrospectionQueryResult,
} from '../../../src/core/graphql/introspection.js';
import { detectCapabilities } from '../../../src/core/capabilities/detector.js';
import { extractSchemaVersion } from '../../../src/core/capabilities/schema-version.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchSchemaIntrospection', () => {
  it('executes the standard introspection query', async () => {
    const snapshot = makeSchemaSnapshot();
    const execute = vi.fn().mockResolvedValue(snapshot);
    const client = { execute, requestId: 'req-1' } as UcliGraphQLClient;

    const result = await fetchSchemaIntrospection(client);

    expect(result).toEqual(snapshot);
    expect(execute).toHaveBeenCalledWith(DEFAULT_INTROSPECTION_QUERY);
  });
});

describe('schema snapshots', () => {
  it('saves and loads a JSON snapshot', async () => {
    const snapshot = makeSchemaSnapshot();
    const dir = await mkdtemp(join(tmpdir(), 'ucli-introspection-'));
    const filePath = join(dir, 'schema.snapshot.json');

    await saveSchemaSnapshot(snapshot, filePath);
    const loaded = await loadSchemaSnapshot(filePath);

    expect(loaded).toEqual(snapshot);
  });

  it('can save a snapshot as SDL', async () => {
    const snapshot = makeSchemaSnapshot();
    const dir = await mkdtemp(join(tmpdir(), 'ucli-introspection-'));
    const filePath = join(dir, 'schema.graphql');

    await saveSchemaSnapshot(snapshot, filePath, { format: 'sdl' });
    const content = await readFile(filePath, 'utf8');

    expect(content).toContain('type Query');
    expect(content).toContain('apiVersion: String');
  });
});

describe('detectCapabilities', () => {
  it('lists available queries and mutations from schema roots', () => {
    const result = detectCapabilities(makeSchemaSnapshot({ schemaDescription: 'Unraid API v7.1.0' }));

    expect(result.availableQueries).toEqual(['info', 'system']);
    expect(result.availableMutations).toEqual(['restartArray', 'stopArray']);
    expect(result.apiVersion).toBe('7.1.0');
    expect(result.supported).toBe(true);
  });

  it('identifies missing expected operations', () => {
    const result = detectCapabilities(makeSchemaSnapshot(), {
      expected: {
        queries: ['info', 'system', 'notifications'],
        mutations: ['stopArray', 'pauseParityCheck'],
      },
    });

    expect(result.missingQueries).toEqual(['notifications']);
    expect(result.missingMutations).toEqual(['pauseParityCheck']);
    expect(result.supported).toBe(false);
  });
});

describe('extractSchemaVersion', () => {
  it('extracts the version from schema metadata', () => {
    const version = extractSchemaVersion(
      makeSchemaSnapshot({ schemaDescription: 'Unraid GraphQL API version 7.0.5-beta.1' }),
    );

    expect(version).toBe('7.0.5-beta.1');
  });

  it('falls back to info type descriptions when schema description is missing', () => {
    const version = extractSchemaVersion(
      makeSchemaSnapshot({
        schemaDescription: null,
        infoDescription: 'Server metadata for v6.12.13',
      }),
    );

    expect(version).toBe('6.12.13');
  });
});

function makeSchemaSnapshot(options: {
  schemaDescription?: string | null;
  infoDescription?: string | null;
} = {}): IntrospectionQueryResult {
  return {
    __schema: {
      description: options.schemaDescription ?? null,
      queryType: { name: 'Query' },
      mutationType: { name: 'Mutation' },
      subscriptionType: null,
      directives: [],
      types: [
        {
          kind: 'OBJECT',
          name: 'Query',
          description: null,
          fields: [
            {
              name: 'system',
              description: null,
              args: [],
              isDeprecated: false,
              deprecationReason: null,
              type: { kind: 'OBJECT', name: 'System', ofType: null },
            },
            {
              name: 'info',
              description: null,
              args: [],
              isDeprecated: false,
              deprecationReason: null,
              type: { kind: 'OBJECT', name: 'Info', ofType: null },
            },
          ],
          inputFields: null,
          interfaces: [],
          enumValues: null,
          possibleTypes: null,
        },
        {
          kind: 'OBJECT',
          name: 'Mutation',
          description: null,
          fields: [
            {
              name: 'restartArray',
              description: null,
              args: [],
              isDeprecated: false,
              deprecationReason: null,
              type: { kind: 'SCALAR', name: 'Boolean', ofType: null },
            },
            {
              name: 'stopArray',
              description: null,
              args: [],
              isDeprecated: false,
              deprecationReason: null,
              type: { kind: 'SCALAR', name: 'Boolean', ofType: null },
            },
          ],
          inputFields: null,
          interfaces: [],
          enumValues: null,
          possibleTypes: null,
        },
        {
          kind: 'OBJECT',
          name: 'Info',
          description: options.infoDescription ?? null,
          fields: [
            {
              name: 'apiVersion',
              description: null,
              args: [],
              isDeprecated: false,
              deprecationReason: null,
              type: { kind: 'SCALAR', name: 'String', ofType: null },
            },
          ],
          inputFields: null,
          interfaces: [],
          enumValues: null,
          possibleTypes: null,
        },
        {
          kind: 'OBJECT',
          name: 'System',
          description: null,
          fields: [],
          inputFields: null,
          interfaces: [],
          enumValues: null,
          possibleTypes: null,
        },
        {
          kind: 'SCALAR',
          name: 'String',
          description: null,
          specifiedByURL: null,
        },
        {
          kind: 'SCALAR',
          name: 'Boolean',
          description: null,
          specifiedByURL: null,
        },
      ],
    },
  } as IntrospectionQueryResult;
}
