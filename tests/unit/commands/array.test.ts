import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../../src/cli/index.js';

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/fixtures/array-response.json'), 'utf8'),
) as Record<string, unknown>;

const { executeMock, createClientMock } = vi.hoisted(() => {
  const execute = vi.fn();
  const createClient = vi.fn(() => ({
    execute,
    requestId: 'req-array-test',
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

describe('array command group', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeMock.mockResolvedValue(fixture);
    process.env.UCLI_HOST = 'http://tower.local:7777';
    process.env.UCLI_API_KEY = 'test-api-key';
  });

  it('registers the array command and all subcommands', () => {
    const program = createProgram();
    const arrayCommand = program.commands.find((command) => command.name() === 'array');

    expect(arrayCommand).toBeDefined();
    const names = arrayCommand?.commands.map((command) => command.name());
    expect(names).toContain('show');
    expect(names).toContain('status');
    expect(names).toContain('devices');
    expect(names).toContain('parity');
  });

  it('parity command has status and history subcommands', () => {
    const program = createProgram();
    const arrayCommand = program.commands.find((command) => command.name() === 'array');
    const parityCommand = arrayCommand?.commands.find((command) => command.name() === 'parity');

    expect(parityCommand).toBeDefined();
    const names = parityCommand?.commands.map((command) => command.name());
    expect(names).toContain('status');
    expect(names).toContain('history');
  });

  it('array show renders state and capacity in human mode', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'array', 'show', '--output', 'human']);

    expect(stdout).toContain('state: Started');
    expect(stdout).toContain('diskCount: 4');
    expect(createClientMock).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: 'http://tower.local:7777/graphql',
      apiKey: 'test-api-key',
    }));
  });

  it('array show renders JSON output', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'array', 'show', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed.state).toBe('Started');
    expect(parsed.diskCount).toBe(4);
    expect(typeof parsed.capacity).toBe('string');
    expect(typeof parsed.used).toBe('string');
    expect(typeof parsed.free).toBe('string');
  });

  it('array status shows array state and parity info', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'array', 'status', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed.state).toBe('Started');
    expect(parsed.parityStatus).toBe('idle');
    expect(parsed.parityErrors).toBe(0);
  });

  it('array devices lists all disks in json mode', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'array', 'devices', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Array<Record<string, unknown>>;
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(4);
    expect(parsed[0]?.name).toBe('disk1');
    expect(parsed[0]?.status).toBe('DISK_OK');
    expect(typeof parsed[0]?.size).toBe('string');
  });

  it('array devices supports --filter', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'array', 'devices', '--output', 'json', '--filter', 'status=DISK_OK']);

    const parsed = JSON.parse(stdout) as Array<Record<string, unknown>>;
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.every((d) => d['status'] === 'DISK_OK')).toBe(true);
  });

  it('array devices supports --sort', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'array', 'devices', '--output', 'json', '--sort', 'name:asc']);

    const parsed = JSON.parse(stdout) as Array<Record<string, unknown>>;
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]?.name).toBe('disk1');
    expect(parsed[1]?.name).toBe('disk2');
  });

  it('array parity status shows parity info', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'array', 'parity', 'status', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed.status).toBe('idle');
    expect(parsed.progress).toBe(100);
    expect(parsed.errors).toBe(0);
  });

  it('array parity history shows history entries', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'array', 'parity', 'history', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Array<Record<string, unknown>>;
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.status).toBe('ok');
    expect(parsed[0]?.errors).toBe(0);
    expect(typeof parsed[0]?.duration).toBe('string');
  });

  it('formatters handle null values gracefully', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    executeMock.mockResolvedValue({
      array: {
        state: 'STOPPED',
        capacity: { kilobytes: { total: null, used: null, free: null } },
        parityCheckStatus: null,
        disks: [],
      },
    });

    await program.parseAsync(['node', 'ucli', 'array', 'show', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed.state).toBe('Stopped');
    expect(parsed.capacity).toBe('unknown');
  });
});
