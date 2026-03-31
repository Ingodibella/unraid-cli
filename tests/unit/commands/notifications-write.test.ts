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
    executeMock.mockImplementation((document: string) => {
      if (document.includes('mutation ArchiveNotification')) {
        return Promise.resolve({ archiveNotification: { success: true, message: null } });
      }
      if (document.includes('mutation ArchiveAllNotifications')) {
        return Promise.resolve({ archiveAllNotifications: { success: true, message: 'archived all' } });
      }
      if (document.includes('mutation UnarchiveNotification')) {
        return Promise.resolve({ unarchiveNotification: { success: true, message: null } });
      }
      if (document.includes('mutation UnreadNotification')) {
        return Promise.resolve({ unreadNotification: { success: true, message: null } });
      }
      if (document.includes('mutation DeleteNotification')) {
        return Promise.resolve({ deleteNotification: { success: true, message: 'deleted' } });
      }
      if (document.includes('mutation DeleteArchivedNotifications')) {
        return Promise.resolve({ deleteArchivedNotifications: { success: true, message: 'deleted all archived' } });
      }
      if (document.includes('mutation CreateNotification')) {
        return Promise.resolve({
          createNotification: {
            id: 'n-100',
            title: 'Build done',
            message: 'Task completed',
            severity: 'info',
            timestamp: '2026-03-31T12:00:00.000Z',
            read: false,
          },
        });
      }

      return Promise.resolve({ notifications: [] });
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

  it('requires --yes for archive --all (S2)', async () => {
    const program = createProgram();
    await expect(
      program.parseAsync(['node', 'ucli', 'notifications', 'archive', '--all', '--output', 'json']),
    ).rejects.toMatchObject({
      exitCode: 10,
      message: 'Critical action notifications.archive-all requires --yes.',
    });
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

  it('requires --yes --force for delete --all (S3)', async () => {
    const program = createProgram();

    await expect(
      program.parseAsync(['node', 'ucli', 'notifications', 'delete', '--all', '--yes', '--output', 'json']),
    ).rejects.toMatchObject({
      exitCode: 10,
      message: 'Destructive action notifications.delete requires both --yes and --force.',
    });

    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync([
      'node',
      'ucli',
      'notifications',
      'delete',
      '--all',
      '--yes',
      '--force',
      '--output',
      'json',
    ]);

    expect(JSON.parse(stdout)).toMatchObject({ action: 'delete', target: 'all-archived', success: true });
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
      '--message',
      'Task completed',
      '--severity',
      'info',
      '--yes',
      '--output',
      'json',
    ]);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed.action).toBe('create');
    expect(parsed.notification).toMatchObject({ id: 'n-100', severity: 'info' });
  });
});
