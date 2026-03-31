import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../../src/cli/index.js';

const { executeMock, createClientMock } = vi.hoisted(() => {
  const execute = vi.fn();
  const createClient = vi.fn(() => ({
    execute,
    requestId: 'req-notifications-write-test',
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

describe('notifications write commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeMock.mockImplementation((document: string, variables?: { filter?: { type?: 'UNREAD' | 'ARCHIVE' } }) => {
      if (document.includes('mutation ArchiveNotification')) {
        return Promise.resolve({
          archiveNotification: {
            id: 'n-1', title: 'x', subject: 'x', description: 'x', importance: 'INFO', link: null, type: 'ARCHIVE', timestamp: null,
          },
        });
      }
      if (document.includes('mutation UnreadNotification')) {
        return Promise.resolve({
          unreadNotification: {
            id: 'n-1', title: 'x', subject: 'x', description: 'x', importance: 'INFO', link: null, type: 'UNREAD', timestamp: null,
          },
        });
      }
      if (document.includes('mutation DeleteNotification')) {
        return Promise.resolve({
          deleteNotification: {
            unread: { info: 0, warning: 0, alert: 0, total: 0 },
            archive: { info: 0, warning: 0, alert: 0, total: 0 },
          },
        });
      }
      if (document.includes('mutation CreateNotification')) {
        return Promise.resolve({
          createNotification: {
            id: 'n-100',
            title: 'Build done',
            subject: 'Pipeline',
            description: 'Task completed',
            importance: 'INFO',
            link: null,
            type: 'UNREAD',
            timestamp: '2026-03-31T12:00:00.000Z',
          },
        });
      }

      const list = variables?.filter?.type === 'ARCHIVE'
        ? []
        : [
          {
            id: 'n-2',
            title: 'Disk warning',
            subject: 'Disks',
            description: 'Disk disk3 is at 55C.',
            importance: 'WARNING',
            link: null,
            type: 'UNREAD',
            timestamp: '2026-03-31T10:00:00.000Z',
          },
        ];

      return Promise.resolve({ notifications: { list } });
    });

    process.env.UCLI_HOST = 'http://tower.local:7777';
    process.env.UCLI_API_KEY = 'test-api-key';
  });

  it('archives and unarchives one notification with --yes', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'notifications', 'archive', 'n-1', '--yes', '--output', 'json']);
    expect(JSON.parse(stdout)).toMatchObject({ action: 'archive', target: 'n-1', success: true });

    stdout = '';
    await program.parseAsync(['node', 'ucli', 'notifications', 'unarchive', 'n-1', '--yes', '--output', 'json']);
    expect(JSON.parse(stdout)).toMatchObject({ action: 'unarchive', target: 'n-1', success: true });
  });

  it('marks unread and deletes single with --yes', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'notifications', 'unread', 'n-2', '--yes', '--output', 'json']);
    expect(JSON.parse(stdout)).toMatchObject({ action: 'unread', target: 'n-2', success: true });

    stdout = '';
    await program.parseAsync(['node', 'ucli', 'notifications', 'delete', 'n-2', '--yes', '--output', 'json']);
    expect(JSON.parse(stdout)).toMatchObject({ action: 'delete', target: 'n-2', success: true });
  });

  it('creates notification with required fields and --yes', async () => {
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
      'create',
      '--title',
      'Build done',
      '--subject',
      'Pipeline',
      '--description',
      'Task completed',
      '--importance',
      'info',
      '--yes',
      '--output',
      'json',
    ]);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed.action).toBe('create');
    expect(parsed.notification).toMatchObject({ id: 'n-100', importance: 'INFO' });
  });
});
