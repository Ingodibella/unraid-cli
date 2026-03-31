import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../../src/cli/index.js';

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/fixtures/shares-response.json'), 'utf8'),
) as { shares: Array<Record<string, unknown>> };

const { executeMock, createClientMock } = vi.hoisted(() => {
  const execute = vi.fn();
  const createClient = vi.fn(() => ({
    execute,
    requestId: 'req-shares-test',
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

describe('shares command group', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeMock.mockResolvedValue({ shares: fixture.shares });
    process.env.UCLI_HOST = 'http://tower.local:7777';
    process.env.UCLI_API_KEY = 'test-api-key';
  });

  it('registers shares command and all subcommands', () => {
    const program = createProgram();
    const sharesCommand = program.commands.find((command) => command.name() === 'shares');

    expect(sharesCommand).toBeDefined();
    expect(sharesCommand?.commands.map((command) => command.name())).toEqual([
      'list',
      'get',
      'usage',
    ]);
  });

  it('shares list shows all shares with required fields', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'shares', 'list', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Array<Record<string, unknown>>;
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toMatchObject({
      name: 'appdata',
      type: 'user',
      size: '500.00 GB',
      used: '320.00 GB',
      free: '180.00 GB',
      allocation: 'high-water',
    });
  });

  it('shares get returns detailed share information', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'shares', 'get', 'media', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed).toMatchObject({
      name: 'media',
      type: 'user',
      size: '2.00 TB',
      used: '1.50 TB',
      free: '512.00 GB',
      usedPercent: 75,
      freePercent: 25,
      allocation: 'most-free',
    });
  });

  it('shares usage shows summary and utilization across all shares', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'shares', 'usage', '--output', 'json']);

    const parsed = JSON.parse(stdout) as {
      summary: Record<string, unknown>;
      shares: Array<Record<string, unknown>>;
    };

    expect(parsed.summary).toMatchObject({
      totalShares: 3,
      totalSize: '2.74 TB',
      totalUsed: '1.94 TB',
      totalFree: '820.00 GB',
      usedPercent: 70.76,
      freePercent: 29.24,
    });
    expect(parsed.shares[0]).toMatchObject({
      name: 'appdata',
      usedPercent: 64,
      freePercent: 36,
    });
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
      'shares',
      'list',
      '--output',
      'json',
      '--filter',
      'type=user',
      '--sort',
      'name:desc',
      '--page',
      '1',
      '--page-size',
      '1',
      '--fields',
      'name,type',
    ]);

    expect(JSON.parse(stdout)).toEqual([
      { name: 'media', type: 'user' },
    ]);

    for (const format of ['yaml', 'table']) {
      const program = createProgram();
      stdout = '';
      process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
        stdout += String(chunk);
        return true;
      });

      await program.parseAsync(['node', 'ucli', 'shares', 'usage', '--output', format]);
      expect(stdout.length).toBeGreaterThan(0);
    }
  });
});
