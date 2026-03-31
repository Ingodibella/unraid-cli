import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../../src/cli/index.js';
import { createNotificationsWatchCommand } from '../../../src/commands/notifications/watch.js';

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/fixtures/notifications-response.json'), 'utf8'),
) as { notifications: Array<Record<string, unknown>> };

const { executeMock, createClientMock } = vi.hoisted(() => {
  const execute = vi.fn();
  const createClient = vi.fn(() => ({
    execute,
    requestId: 'req-notifications-test',
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

describe('notifications command group', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeMock.mockResolvedValue({ notifications: fixture.notifications });
    process.env.UCLI_HOST = 'http://tower.local:7777';
    process.env.UCLI_API_KEY = 'test-api-key';
  });

  it('registers notifications command and all subcommands', () => {
    const program = createProgram();
    const notificationsCommand = program.commands.find((command) => command.name() === 'notifications');

    expect(notificationsCommand).toBeDefined();
    expect(notificationsCommand?.commands.map((command) => command.name())).toEqual([
      'list',
      'get',
      'latest',
      'watch',
      'archive',
      'unarchive',
      'unread',
      'delete',
      'create',
    ]);
  });

  it('notifications list returns all records and supports filter/sort/page', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync([
      'node',
      'ucli',
      'notifications',
      'list',
      '--output',
      'json',
      '--filter',
      'severity=alert',
      '--sort',
      'timestamp:desc',
      '--page',
      '1',
      '--page-size',
      '1',
    ]);

    expect(JSON.parse(stdout)).toEqual([
      {
        id: 'n-003',
        title: 'UPS on battery',
        message: 'Power outage detected, UPS runtime 18 minutes.',
        severity: 'alert',
        timestamp: '2026-03-31T11:00:00.000Z',
        read: false,
      },
    ]);
  });

  it('notifications get returns a single notification by id', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'notifications', 'get', 'n-002', '--output', 'json']);

    expect(JSON.parse(stdout)).toMatchObject({
      id: 'n-002',
      title: 'Disk temperature warning',
      severity: 'warning',
      read: false,
    });
  });

  it('notifications latest returns newest N notifications', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'notifications', 'latest', '--limit', '2', '--output', 'json']);

    expect(JSON.parse(stdout)).toEqual([
      expect.objectContaining({ id: 'n-003' }),
      expect.objectContaining({ id: 'n-002' }),
    ]);
  });

  it('notifications watch polls using interval and exits cleanly on ctrl+c', async () => {
    executeMock
      .mockResolvedValueOnce({ notifications: fixture.notifications })
      .mockResolvedValueOnce({
        notifications: [
          ...fixture.notifications,
          {
            id: 'n-004',
            title: 'Array degraded',
            message: 'Disk disk4 reported read errors.',
            severity: 'critical',
            timestamp: '2026-03-31T11:05:00.000Z',
            read: false,
          },
        ],
      });

    let stdout = '';
    let pollFn: (() => void) | undefined;
    const signalHandlers = new Map<NodeJS.Signals, () => void>();

    const setIntervalMock = vi.fn((callback: () => void) => {
      pollFn = callback;
      return 7 as unknown as NodeJS.Timeout;
    });
    const clearIntervalMock = vi.fn();

    const command = createNotificationsWatchCommand({
      createGraphQLClient: createClientMock,
      stdoutWrite: (chunk: string) => {
        stdout += chunk;
        return true;
      },
      stderrWrite: () => true,
      setInterval: setIntervalMock as unknown as typeof globalThis.setInterval,
      clearInterval: clearIntervalMock as unknown as typeof globalThis.clearInterval,
      addSignalListener: (signal, listener) => {
        signalHandlers.set(signal, listener);
      },
      removeSignalListener: () => {
        // no-op for test
      },
    });

    const runPromise = command.parseAsync(['node', 'watch', '--interval', '5', '--output', 'json']);

    // Allow enough microtasks for the async action to complete fetchNotifications + reach setInterval
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(setIntervalMock).toHaveBeenCalledWith(expect.any(Function), 5000);

    pollFn?.();
    await new Promise((resolve) => setTimeout(resolve, 50));
    signalHandlers.get('SIGINT')?.();
    await runPromise;

    expect(clearIntervalMock).toHaveBeenCalled();
    const parsed: unknown = JSON.parse(stdout.trim());
    expect(parsed).toMatchObject({ id: 'n-004', severity: 'critical' });
  });

  it('supports fields and structured output modes', async () => {
    const jsonProgram = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await jsonProgram.parseAsync([
      'node',
      'ucli',
      'notifications',
      'list',
      '--output',
      'json',
      '--fields',
      'id,severity',
    ]);

    expect(JSON.parse(stdout)).toEqual([
      { id: 'n-001', severity: 'info' },
      { id: 'n-002', severity: 'warning' },
      { id: 'n-003', severity: 'alert' },
    ]);

    for (const format of ['yaml', 'table']) {
      const program = createProgram();
      stdout = '';
      process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
        stdout += String(chunk);
        return true;
      });

      await program.parseAsync(['node', 'ucli', 'notifications', 'latest', '--output', format]);
      expect(stdout.length).toBeGreaterThan(0);
    }
  });
});
