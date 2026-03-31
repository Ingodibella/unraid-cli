import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../../src/cli/index.js';

const fixture = JSON.parse(readFileSync(resolve(process.cwd(), 'tests/fixtures/vms-response.json'), 'utf8')) as { vms: { domains: Array<Record<string, unknown>> } };

const { executeMock, createClientMock } = vi.hoisted(() => {
  const execute = vi.fn();
  const createClient = vi.fn(() => ({ execute, requestId: 'req-vms-test' }));
  return { executeMock: execute, createClientMock: createClient };
});

vi.mock('../../../src/core/graphql/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/core/graphql/client.js')>();
  return { ...actual, createClient: createClientMock };
});

describe('vms command group', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeMock.mockResolvedValue(fixture);
    process.env.UCLI_HOST = 'http://tower.local:7777';
    process.env.UCLI_API_KEY = 'test-api-key';
  });

  it('vms list shows id,name,state', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => ((stdout += String(chunk)), true));

    await program.parseAsync(['node', 'ucli', 'vms', 'list', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Array<Record<string, unknown>>;
    expect(parsed[0]).toMatchObject({ id: 'vm-101', name: 'ubuntu-dev', state: 'RUNNING' });
  });

  it('vms get resolves by name', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => ((stdout += String(chunk)), true));

    await program.parseAsync(['node', 'ucli', 'vms', 'get', 'ubuntu-dev', '--output', 'json']);
    expect(JSON.parse(stdout)).toMatchObject({ id: 'vm-101', state: 'RUNNING' });
  });

  it('vms status summary uses state', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => ((stdout += String(chunk)), true));

    await program.parseAsync(['node', 'ucli', 'vms', 'status', '--output', 'json']);
    const parsed = JSON.parse(stdout) as { summary: Record<string, number> };
    expect(parsed.summary).toEqual({ running: 1, stopped: 1, paused: 1, other: 0 });
  });
});
