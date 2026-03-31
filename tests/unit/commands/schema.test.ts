import { mkdtemp, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IntrospectionQueryResult } from '../../../src/core/graphql/introspection.js';
import { createProgram } from '../../../src/cli/index.js';

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/fixtures/schema-introspection.json'), 'utf8'),
) as IntrospectionQueryResult;

const { executeMock, createClientMock } = vi.hoisted(() => {
  const execute = vi.fn();
  const createClient = vi.fn(() => ({ execute, requestId: 'req-schema-test' }));
  return { executeMock: execute, createClientMock: createClient };
});

vi.mock('../../../src/core/graphql/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/core/graphql/client.js')>();
  return {
    ...actual,
    createClient: createClientMock,
  };
});

describe('schema command group', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeMock.mockResolvedValue(structuredClone(fixture));
    process.env.UCLI_HOST = 'http://tower.local:7777';
    process.env.UCLI_API_KEY = 'test-api-key';
  });

  it('registers schema command with all subcommands', () => {
    const program = createProgram();
    const schemaCommand = program.commands.find((command) => command.name() === 'schema');

    expect(schemaCommand?.commands.map((command) => command.name())).toEqual([
      'info',
      'queries',
      'mutations',
      'type',
      'fields',
      'export',
      'diff',
      'validate',
    ]);
  });

  it('schema info reports version and operation counts', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'schema', 'info', '--output', 'json']);

    expect(JSON.parse(stdout)).toEqual({
      version: '7.1.0',
      queryCount: 3,
      mutationCount: 2,
      typeCount: 11,
    });
  });

  it('schema queries and mutations list root fields', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'schema', 'queries', '--output', 'json']);
    expect(JSON.parse(stdout)).toEqual(['array', 'notifications', 'system']);

    stdout = '';
    await program.parseAsync(['node', 'ucli', 'schema', 'mutations', '--output', 'json']);
    expect(JSON.parse(stdout)).toEqual(['array', 'notifications']);
  });

  it('schema type inspects fields for a named type', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'schema', 'type', 'Array', '--output', 'json']);

    expect(JSON.parse(stdout)).toEqual({
      name: 'Array',
      kind: 'OBJECT',
      description: null,
      fields: [
        { name: 'state', type: 'String' },
        { name: 'devices', type: '[Disk]' },
      ],
    });
  });

  it('schema fields returns recursive field tree with depth limit', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'schema', 'fields', 'system', '--depth', '2', '--output', 'json']);
    const tree = JSON.parse(stdout) as { name: string; children: Array<{ name: string; children: unknown[] }> };

    expect(tree.name).toBe('system');
    expect(tree.children.map((child) => child.name)).toEqual(['info', 'status']);
    const infoChild = tree.children.find((child) => child.name === 'info');
    expect(infoChild?.children.map((child) => child.name)).toEqual(['apiVersion']);
  });

  it('schema diff detects type and field changes versus snapshot', async () => {
    const program = createProgram();
    const baseSnapshot = structuredClone(fixture);
    const queryType = baseSnapshot.__schema.types.find((type) => type.name === 'Query');
    if (queryType?.kind === 'OBJECT') {
      queryType.fields = queryType.fields.filter((field) => field.name !== 'notifications');
    }
    baseSnapshot.__schema.types = baseSnapshot.__schema.types.filter((type) => type.name !== 'NotificationMutation');

    const dir = await mkdtemp(join(tmpdir(), 'ucli-schema-diff-'));
    const snapshotPath = join(dir, 'schema.snapshot.json');
    await writeFile(snapshotPath, `${JSON.stringify(baseSnapshot, null, 2)}\n`, 'utf8');

    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'schema', 'diff', '--snapshot', snapshotPath, '--output', 'json']);

    const diff = JSON.parse(stdout) as {
      addedTypes: string[];
      changedTypes: Array<{ type: string; addedFields: string[] }>;
      hasChanges: boolean;
    };

    expect(diff.hasChanges).toBe(true);
    expect(diff.addedTypes).toContain('NotificationMutation');
    expect(diff.changedTypes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'Query', addedFields: ['notifications'] }),
      ]),
    );
  });

  it('schema validate reports unsupported known operations', async () => {
    const program = createProgram();
    const limitedSchema = structuredClone(fixture);
    const queryType = limitedSchema.__schema.types.find((type) => type.name === 'Query');
    if (queryType?.kind === 'OBJECT') {
      queryType.fields = queryType.fields.filter((field) => ['system', 'array'].includes(field.name));
    }

    const mutationType = limitedSchema.__schema.types.find((type) => type.name === 'Mutation');
    if (mutationType?.kind === 'OBJECT') {
      mutationType.fields = mutationType.fields.filter((field) => field.name === 'array');
    }

    executeMock.mockResolvedValueOnce(limitedSchema);

    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'schema', 'validate', '--output', 'json']);

    const result = JSON.parse(stdout) as {
      supported: boolean;
      missingQueries: string[];
      missingMutations: string[];
    };

    expect(result.supported).toBe(false);
    expect(result.missingQueries).toContain('notifications');
    expect(result.missingMutations).toContain('notifications');
  });
});
