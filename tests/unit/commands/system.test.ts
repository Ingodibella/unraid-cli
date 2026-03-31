import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../../src/cli/index.js';
import { GraphQLResponseError } from '../../../src/core/errors/index.js';

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/fixtures/system-info.json'), 'utf8'),
) as Record<string, unknown>;

const { executeMock, createClientMock } = vi.hoisted(() => {
  const execute = vi.fn();
  const createClient = vi.fn(() => ({
    execute,
    requestId: 'req-system-test',
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

describe('system command group', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeMock.mockResolvedValue(fixture);
    process.env.UCLI_HOST = 'http://tower.local:7777';
    process.env.UCLI_API_KEY = 'test-api-key';
  });

  it('registers the system command and all subcommands', () => {
    const program = createProgram();
    const systemCommand = program.commands.find((command) => command.name() === 'system');

    expect(systemCommand).toBeDefined();
    expect(systemCommand?.commands.map((command) => command.name())).toEqual([
      'info',
      'status',
      'health',
      'uptime',
      'resources',
    ]);
  });

  it('renders system info in human mode', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'system', 'info', '--output', 'human']);

    expect(stdout).toContain('osPlatform: Linux');
    expect(stdout).toContain('hostname: tower');
    expect(stdout).toContain('uptimeHuman: 1 day, 2 hours, 3 minutes, 4 seconds');
    expect(createClientMock).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: 'http://tower.local:7777/graphql',
      apiKey: 'test-api-key',
    }));
  });

  it('renders system status in table mode', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'system', 'status', '--output', 'table']);

    expect(stdout).toContain('arrayState');
    expect(stdout).toContain('dockerStatus');
    expect(stdout).toContain('storageUsagePercent');
    expect(stdout).toContain('50');
  });

  it('renders all structured output modes', async () => {
    const outputs: Array<{ format: string; stdout: string }> = [];

    for (const format of ['json', 'yaml', 'table']) {
      const program = createProgram();
      let stdout = '';
      process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
        stdout += String(chunk);
        return true;
      });

      await program.parseAsync(['node', 'ucli', 'system', 'resources', '--output', format]);
      outputs.push({ format, stdout });
    }

    expect(JSON.parse(outputs[0].stdout)).toMatchObject({
      cpuUsage: 23.5,
      memoryUsagePercent: 37.5,
    });
    expect(outputs[1].stdout).toContain('cpuUsage: 23.5');
    expect(outputs[2].stdout).toContain('memoryUsagePercent');
  });

  it('supports field selection', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync([
      'node',
      'ucli',
      'system',
      'health',
      '--output',
      'json',
      '--fields',
      'parityStatus,disks.name',
    ]);

    expect(JSON.parse(stdout)).toEqual({
      parityStatus: 'healthy',
      disks: {
        name: ['disk1', 'disk2', 'parity'],
      },
    });
  });

  it('renders uptime in human readable form', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'system', 'uptime', '--output', 'json']);

    expect(JSON.parse(stdout)).toEqual({
      seconds: 93784,
      human: '1 day, 2 hours, 3 minutes, 4 seconds',
    });
  });

  it('propagates typed GraphQL errors with the correct exit code', async () => {
    const program = createProgram();
    executeMock.mockRejectedValueOnce(
      new GraphQLResponseError([{ message: 'system query failed' }], 'req-system-test'),
    );

    await expect(
      program.parseAsync(['node', 'ucli', 'system', 'info', '--output', 'json']),
    ).rejects.toMatchObject({
      exitCode: 8,
      name: 'GraphQLResponseError',
    });
  });
});
