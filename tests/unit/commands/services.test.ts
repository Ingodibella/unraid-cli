import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../../src/cli/index.js';

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/fixtures/services-response.json'), 'utf8'),
) as Record<string, unknown>;

const { executeMock, createClientMock } = vi.hoisted(() => {
  const execute = vi.fn();
  const createClient = vi.fn(() => ({
    execute,
    requestId: 'req-services-test',
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

describe('services command group', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeMock.mockImplementation((document: string, variables?: { name?: string }) => {
      if (document.includes('service(name: $name)')) {
        const name = variables?.name ?? 'docker';
        const services = fixture.services as Array<Record<string, unknown>>;
        const match = services.find((service) => service['name'] === name) ?? null;
        return Promise.resolve({ service: match });
      }

      return Promise.resolve({ services: fixture.services });
    });

    process.env.UCLI_HOST = 'http://tower.local:7777';
    process.env.UCLI_API_KEY = 'test-api-key';
  });

  it('registers the services command and all subcommands', () => {
    const program = createProgram();
    const servicesCommand = program.commands.find((command) => command.name() === 'services');

    expect(servicesCommand).toBeDefined();
    expect(servicesCommand?.commands.map((command) => command.name())).toEqual([
      'list',
      'get',
      'status',
    ]);
  });

  it('services list returns all services', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'services', 'list', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Array<Record<string, unknown>>;
    expect(parsed).toEqual([
      { name: 'docker', status: 'running', enabled: true },
      { name: 'smbd', status: 'running', enabled: true },
      { name: 'nfsd', status: 'stopped', enabled: false },
    ]);
  });

  it('services get returns detailed service info', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'services', 'get', 'docker', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed).toMatchObject({
      name: 'docker',
      status: 'running',
      pid: 1024,
      uptime: '1d 3h',
      description: 'Docker daemon',
    });
  });

  it('services status returns summary and detailed status list', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'services', 'status', '--output', 'json']);

    const parsed = JSON.parse(stdout) as {
      summary: Record<string, number>;
      services: Array<Record<string, unknown>>;
    };

    expect(parsed.summary).toEqual({ running: 2, stopped: 1, other: 0 });
    expect(parsed.services).toHaveLength(3);
  });
});
