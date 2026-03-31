import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../../src/cli/index.js';

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/fixtures/services-response.json'), 'utf8'),
) as { services: Array<Record<string, unknown>> };

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
    executeMock.mockResolvedValue({ services: fixture.services });

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
      { id: 'service:docker', name: 'docker', online: true, version: '25.0.3', uptime: '2026-03-31T10:00:00.000Z' },
      { id: 'service:smbd', name: 'smbd', online: true, version: '4.20.0', uptime: '2026-03-31T11:00:00.000Z' },
      { id: 'service:nfsd', name: 'nfsd', online: false, version: null, uptime: null },
    ]);
  });

  it('services get returns service info', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'services', 'get', 'docker', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed).toMatchObject({
      id: 'service:docker',
      name: 'docker',
      online: true,
      version: '25.0.3',
      uptime: { timestamp: '2026-03-31T10:00:00.000Z' },
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

    expect(parsed.summary).toEqual({ online: 2, offline: 1 });
    expect(parsed.services).toHaveLength(3);
  });
});
