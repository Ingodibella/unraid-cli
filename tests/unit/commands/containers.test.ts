import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../../src/cli/index.js';

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/fixtures/docker-response.json'), 'utf8'),
) as Record<string, unknown>;

const { executeMock, createClientMock } = vi.hoisted(() => {
  const execute = vi.fn();
  const createClient = vi.fn(() => ({
    execute,
    requestId: 'req-containers-test',
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

describe('containers command group', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeMock.mockImplementation((document: string, variables?: { name?: string }) => {
      if (document.includes('container(name: $name)')) {
        const name = variables?.name ?? 'nginx';
        const containers = ((fixture.docker as { containers: Array<Record<string, unknown>> }).containers);
        const match = containers.find((container) => {
          const rawName = String(container['name'] ?? '');
          return rawName.replace(/^\/+/, '') === name;
        }) ?? null;

        return Promise.resolve({
          docker: {
            container: match,
          },
        });
      }

      return Promise.resolve({
        docker: (fixture.docker as Record<string, unknown>),
      });
    });
    process.env.UCLI_HOST = 'http://tower.local:7777';
    process.env.UCLI_API_KEY = 'test-api-key';
  });

  it('registers the containers command and all subcommands', () => {
    const program = createProgram();
    const containersCommand = program.commands.find((command) => command.name() === 'containers');

    expect(containersCommand).toBeDefined();
    expect(containersCommand?.commands.map((command) => command.name())).toEqual([
      'list',
      'get',
      'status',
      'inspect',
      'logs',
      'stats',
      'start',
      'stop',
      'restart',
      'pause',
      'unpause',
      'remove',
    ]);
  });

  it('containers list shows all containers with normalized names', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'containers', 'list', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Array<Record<string, unknown>>;
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toMatchObject({
      name: 'nginx',
      image: 'nginx:1.27',
      status: 'running',
      ports: '8080->80/tcp',
      uptime: '1d 2h',
    });
    expect(createClientMock).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: 'http://tower.local:7777/graphql',
      apiKey: 'test-api-key',
    }));
  });

  it('containers get shows detailed container info', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'containers', 'get', 'nginx', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed).toMatchObject({
      id: 'abc123',
      name: 'nginx',
      status: 'running',
      cpuPercent: 3.4,
      memoryPercent: 25,
    });
    expect(parsed['memoryUsage']).toBe('64.00 MB');
  });

  it('containers status shows summary counts and per-container status', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'containers', 'status', '--output', 'json']);

    const parsed = JSON.parse(stdout) as {
      summary: Record<string, number>;
      containers: Array<Record<string, unknown>>;
    };
    expect(parsed.summary).toEqual({ running: 1, stopped: 1, paused: 1, other: 0 });
    expect(parsed.containers[1]).toMatchObject({ name: 'redis', status: 'paused', state: 'paused' });
  });

  it('containers inspect shows raw inspect payload', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'containers', 'inspect', 'nginx', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed).toEqual({
      config: {
        hostname: 'nginx',
      },
      state: {
        running: true,
        status: 'running',
      },
    });
  });

  it('containers logs shows container logs', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'containers', 'logs', 'nginx', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed).toEqual({
      name: 'nginx',
      logs: 'nginx started\nready',
    });
  });

  it('containers stats shows resource usage per container', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'containers', 'stats', '--output', 'json', '--sort', 'cpuPercent:desc']);

    const parsed = JSON.parse(stdout) as Array<Record<string, unknown>>;
    expect(parsed[0]).toMatchObject({
      name: 'nginx',
      cpuPercent: 3.4,
      memoryPercent: 25,
    });
    expect(parsed[0]?.['memoryUsage']).toBe('64.00 MB');
  });

  it('supports filter, sort, page, fields, and structured output modes', async () => {
    const jsonProgram = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await jsonProgram.parseAsync([
      'node',
      'ucli',
      'containers',
      'list',
      '--output',
      'json',
      '--filter',
      'status=running',
      '--sort',
      'name:desc',
      '--page',
      '1',
      '--page-size',
      '1',
      '--fields',
      'name,status',
    ]);

    expect(JSON.parse(stdout)).toEqual([
      { name: 'nginx', status: 'running' },
    ]);

    for (const format of ['yaml', 'table']) {
      const program = createProgram();
      stdout = '';
      process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
        stdout += String(chunk);
        return true;
      });

      await program.parseAsync(['node', 'ucli', 'containers', 'stats', '--output', format]);
      expect(stdout.length).toBeGreaterThan(0);
    }
  });
});
