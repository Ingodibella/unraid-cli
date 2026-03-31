import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../../src/cli/index.js';

const { executeMock, createClientMock } = vi.hoisted(() => {
  const execute = vi.fn();
  const createClient = vi.fn(() => ({
    execute,
    requestId: 'req-disks-write-test',
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

describe('disks write commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeMock.mockImplementation((document: string) => {
      if (document.includes('mutation DiskMount')) {
        return Promise.resolve({ array: { mountArrayDisk: 'mounted' } });
      }
      if (document.includes('mutation DiskUnmount')) {
        return Promise.resolve({ array: { unmountArrayDisk: 'unmounted' } });
      }
      if (document.includes('mutation DiskClearStats')) {
        return Promise.resolve({ array: { clearArrayDiskStatistics: true } });
      }

      return Promise.resolve({ disks: [] });
    });

    process.env.UCLI_HOST = 'http://tower.local:7777';
    process.env.UCLI_API_KEY = 'test-api-key';
  });

  it('runs disk mount with --yes (S1)', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'disks', 'mount', '1', '--yes', '--output', 'json']);

    expect(JSON.parse(stdout)).toMatchObject({ action: 'mount', idx: 1, success: true });
    expect(executeMock).toHaveBeenCalledWith(expect.stringContaining('mutation DiskMount'), { idx: 1 });
  });

  it('requires --yes for unmount and clear-stats (S2)', async () => {
    const program = createProgram();

    await expect(
      program.parseAsync(['node', 'ucli', 'disks', 'unmount', '1', '--output', 'json']),
    ).rejects.toMatchObject({
      exitCode: 10,
      message: 'Critical action disks.unmount requires --yes.',
    });

    await expect(
      program.parseAsync(['node', 'ucli', 'disks', 'clear-stats', '1', '--output', 'json']),
    ).rejects.toMatchObject({
      exitCode: 10,
      message: 'Critical action disks.clear-stats requires --yes.',
    });
  });

  it('runs unmount and clear-stats with --yes', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'disks', 'unmount', '1', '--yes', '--output', 'json']);
    expect(JSON.parse(stdout)).toMatchObject({ action: 'unmount', idx: 1, success: true });

    stdout = '';
    await program.parseAsync(['node', 'ucli', 'disks', 'clear-stats', '1', '--yes', '--output', 'json']);
    expect(JSON.parse(stdout)).toMatchObject({ action: 'clear-stats', idx: 1, success: true });
  });
});
