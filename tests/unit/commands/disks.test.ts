import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../../src/cli/index.js';

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/fixtures/disks-response.json'), 'utf8'),
) as Record<string, unknown>;

const { executeMock, createClientMock } = vi.hoisted(() => {
  const execute = vi.fn();
  const createClient = vi.fn(() => ({
    execute,
    requestId: 'req-disks-test',
  }));

  return {
    executeMock: execute,
    createClientMock: createClient,
  };
});

vi.mock('../../../src/core/graphql/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/core/graphql/client.js')>();
  return {
    ...actual,
    createClient: createClientMock,
  };
});

describe('disks command group', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeMock.mockImplementation((document: string) => {
      if (document.includes('query ArrayDisksTemp')) {
        return Promise.resolve({ array: fixture['array'] });
      }

      if (document.includes('assignableDisks')) {
        return Promise.resolve({ assignableDisks: fixture['assignableDisks'] });
      }

      return Promise.resolve({ disks: fixture['disks'] });
    });
    process.env.UCLI_HOST = 'http://tower.local:7777';
    process.env.UCLI_API_KEY = 'test-api-key';
  });

  it('registers the disks command and all subcommands', () => {
    const program = createProgram();
    const disksCommand = program.commands.find((command) => command.name() === 'disks');

    expect(disksCommand).toBeDefined();
    expect(disksCommand?.commands.map((command) => command.name())).toEqual([
      'list',
      'get',
      'status',
      'smart',
      'usage',
      'temp',
      'assignable',
      'mount',
      'unmount',
      'clear-stats',
    ]);
  });

  it('disks list shows all disks with output fields', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'disks', 'list', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Array<Record<string, unknown>>;
    expect(parsed).toHaveLength(5);
    expect(parsed[0]).toMatchObject({
      name: 'disk1',
      smartStatus: 'passed',
      temp: '34C',
      type: 'data',
    });
  });

  it('disks get shows a single disk', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'disks', 'get', 'disk1', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed.name).toBe('disk1');
    expect(parsed.device).toBe('/dev/sdb');
    expect(parsed.tempSeverity).toBe('normal');
    expect(parsed.smartStatus).toBe('passed');
    expect(parsed.serialNum).toBe('SER123');
  });

  it('disks status shows health overview', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'disks', 'status', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Array<Record<string, unknown>>;
    expect(parsed[1]).toMatchObject({
      name: 'disk2',
      smartStatus: 'warning',
      temp: 45,
      type: 'data',
    });
  });

  it('disks smart shows SMART status', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'disks', 'smart', 'disk1', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed.name).toBe('disk1');
    expect(parsed.smartStatus).toBe('passed');
  });

  it('disks usage shows disk size overview', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'disks', 'usage', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Array<Record<string, unknown>>;
    expect(parsed[0]?.name).toBe('disk1');
    expect(parsed[0]?.partitionCount).toBe(1);
    expect(typeof parsed[0]?.total).toBe('string');
  });

  it('disks temp classifies thresholds from array disks', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'disks', 'temp', '--output', 'json', '--sort', 'temp:asc']);

    const parsed = JSON.parse(stdout) as Array<Record<string, unknown>>;
    const cache = parsed.find((entry) => entry['name'] === 'cache');
    const disk2 = parsed.find((entry) => entry['name'] === 'disk2');
    expect(cache?.['severity']).toBe('critical');
    expect(disk2?.['severity']).toBe('warning');
  });

  it('supports filter, sort, page, fields, and assignable list', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync([
      'node',
      'ucli',
      'disks',
      'list',
      '--output',
      'json',
      '--filter',
      'smartStatus=passed',
      '--sort',
      'name:desc',
      '--page',
      '1',
      '--page-size',
      '2',
      '--fields',
      'name,temp',
    ]);

    expect(JSON.parse(stdout)).toEqual([
      { name: 'parity', temp: '37C' },
      { name: 'disk1', temp: '34C' },
    ]);

    stdout = '';
    await program.parseAsync(['node', 'ucli', 'disks', 'assignable', 'list', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Array<Record<string, unknown>>;
    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.name).toBe('disk5');
    expect(parsed[0]?.type).toBe('data');
  });
});
