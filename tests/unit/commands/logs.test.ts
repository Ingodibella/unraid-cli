import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../../src/cli/index.js';

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/fixtures/logs-response.json'), 'utf8'),
) as {
  logFiles: Array<Record<string, unknown>>;
  contents: Record<string, Record<string, unknown>>;
};

const { executeMock, createClientMock } = vi.hoisted(() => {
  const execute = vi.fn();
  const createClient = vi.fn(() => ({
    execute,
    requestId: 'req-logs-test',
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

describe('logs command group', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeMock.mockImplementation((document: string, variables?: { path?: string }) => {
      if (document.includes('query LogFile')) {
        const path = variables?.path ?? '/var/log/syslog';
        return Promise.resolve({ logFile: fixture.contents[path] ?? null });
      }

      return Promise.resolve({ logFiles: fixture.logFiles });
    });

    process.env.UCLI_HOST = 'http://tower.local:7777';
    process.env.UCLI_API_KEY = 'test-api-key';
  });

  it('registers the logs command and all subcommands', () => {
    const program = createProgram();
    const logsCommand = program.commands.find((command) => command.name() === 'logs');

    expect(logsCommand).toBeDefined();
    expect(logsCommand?.commands.map((command) => command.name())).toEqual([
      'list',
      'get',
      'tail',
      'system',
      'search',
    ]);
  });

  it('logs list shows available log files', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'logs', 'list', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Array<Record<string, unknown>>;
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toMatchObject({
      name: 'syslog',
      path: '/var/log/syslog',
      size: 23456,
      modifiedAt: '2026-03-31T11:25:00.000Z',
    });
  });

  it('logs get returns full content of one log file', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'logs', 'get', 'docker.log', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed).toMatchObject({
      name: 'docker.log',
      path: '/var/log/docker.log',
    });
    expect(String(parsed['content'])).toContain('container redis resumed');
  });

  it('logs tail returns last N lines for a log file', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'logs', 'tail', 'app.log', '--lines', '2', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed).toMatchObject({
      name: 'app.log',
      lines: 2,
    });
    expect(parsed['content']).toBe('WARN disk nearly full\nERROR backup failed');
  });

  it('logs system returns system log data', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'logs', 'system', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed).toMatchObject({
      name: 'syslog',
      path: '/var/log/syslog',
    });
    expect(String(parsed['content'])).toContain('kernel: boot complete');
  });

  it('logs search finds matches across logs', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'logs', 'search', '--query', 'error', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Array<Record<string, unknown>>;
    expect(parsed).toEqual([
      {
        name: 'app.log',
        path: '/boot/logs/app.log',
        matchCount: 1,
        excerpt: 'ERROR backup failed',
      },
    ]);
  });
});
