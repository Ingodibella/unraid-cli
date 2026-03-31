import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../../src/cli/index.js';
import { createNotificationsWatchCommand } from '../../../src/commands/notifications/watch.js';

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/fixtures/notifications-response.json'), 'utf8'),
) as { notifications: { list: Array<Record<string, unknown>> } };

const allNotifications = fixture.notifications.list;

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
    executeMock.mockImplementation((_document: string, variables?: { filter?: { type?: 'UNREAD' | 'ARCHIVE' } }) => {
      const requestedType = variables?.filter?.type;
      const list = requestedType == null
        ? allNotifications
        : allNotifications.filter((entry) => entry.type === requestedType);
      return Promise.resolve({ notifications: { list } });
    });
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

  it('notifications list supports filter/sort/page', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync([
      'node', 'ucli', 'notifications', 'list', '--output', 'json',
      '--filter', 'importance=ALERT', '--sort', 'timestamp:desc', '--page', '1', '--page-size', '1',
    ]);

    expect(JSON.parse(stdout)).toEqual([
      {
        id: 'n-003',
        title: 'UPS on battery',
        subject: 'Power',
        description: 'Power outage detected, UPS runtime 18 minutes.',
        importance: 'ALERT',
        type: 'UNREAD',
        timestamp: '2026-03-31T11:00:00.000Z',
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
      importance: 'WARNING',
      type: 'UNREAD',
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

  it('notifications watch polls and exits on ctrl+c', async () => {
    const unread = allNotifications.filter((entry) => entry.type === 'UNREAD');
    const archive = allNotifications.filter((entry) => entry.type === 'ARCHIVE');
    executeMock
      .mockImplementationOnce((_doc, variables?: { filter?: { type?: 'UNREAD' | 'ARCHIVE' } }) => Promise.resolve({
        notifications: { list: (variables?.filter?.type === 'ARCHIVE' ? archive : unread) },
      }))
      .mockImplementationOnce((_doc, variables?: { filter?: { type?: 'UNREAD' | 'ARCHIVE' } }) => Promise.resolve({
        notifications: { list: (variables?.filter?.type === 'ARCHIVE' ? archive : unread) },
      }))
      .mockImplementationOnce((_doc, variables?: { filter?: { type?: 'UNREAD' | 'ARCHIVE' } }) => {
        const nextUnread = [
          ...unread,
          {
            id: 'n-004',
            title: 'Array degraded',
            subject: 'Array',
            description: 'Disk disk4 reported read errors.',
            importance: 'ALERT',
            type: 'UNREAD',
            timestamp: '2026-03-31T11:05:00.000Z',
          },
        ];
        return Promise.resolve({ notifications: { list: variables?.filter?.type === 'ARCHIVE' ? archive : nextUnread } });
      })
      .mockImplementationOnce((_doc, variables?: { filter?: { type?: 'UNREAD' | 'ARCHIVE' } }) => Promise.resolve({
        notifications: { list: (variables?.filter?.type === 'ARCHIVE' ? archive : unread) },
      }));

    let stdout = '';
    let pollFn: (() => void) | undefined;
    const signalHandlers = new Map<NodeJS.Signals, () => void>();

    const command = createNotificationsWatchCommand({
      createGraphQLClient: createClientMock,
      stdoutWrite: (chunk: string) => {
        stdout += chunk;
        return true;
      },
      stderrWrite: () => true,
      setInterval: ((callback: () => void) => {
        pollFn = callback;
        return 7 as unknown as NodeJS.Timeout;
      }) as typeof globalThis.setInterval,
      clearInterval: vi.fn() as unknown as typeof globalThis.clearInterval,
      addSignalListener: (signal, listener) => signalHandlers.set(signal, listener),
      removeSignalListener: () => undefined,
    });

    const runPromise = command.parseAsync(['node', 'watch', '--interval', '5', '--output', 'json']);
    await new Promise((resolve) => setTimeout(resolve, 30));
    pollFn?.();
    await new Promise((resolve) => setTimeout(resolve, 30));
    signalHandlers.get('SIGINT')?.();
    await runPromise;

    const parsed = JSON.parse(stdout.trim()) as Record<string, unknown>;
    expect(parsed).toMatchObject({ id: 'n-004', importance: 'ALERT' });
  });

  it('supports fields and structured output modes', async () => {
    const jsonProgram = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await jsonProgram.parseAsync([
      'node', 'ucli', 'notifications', 'list', '--output', 'json', '--fields', 'id,importance',
    ]);

    expect(JSON.parse(stdout)).toEqual([
      { id: 'n-002', importance: 'WARNING' },
      { id: 'n-003', importance: 'ALERT' },
      { id: 'n-001', importance: 'INFO' },
    ]);
  });
});
