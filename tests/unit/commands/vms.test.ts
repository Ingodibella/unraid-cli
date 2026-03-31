import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../../src/cli/index.js';

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/fixtures/vms-response.json'), 'utf8'),
) as Record<string, unknown>;

const { executeMock, createClientMock } = vi.hoisted(() => {
  const execute = vi.fn();
  const createClient = vi.fn(() => ({
    execute,
    requestId: 'req-vms-test',
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

describe('vms command group', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeMock.mockImplementation((document: string, variables?: { name?: string }) => {
      if (document.includes('vm(name: $name)')) {
        const name = variables?.name ?? 'ubuntu-dev';
        const vms = fixture.vms as Array<Record<string, unknown>>;
        const match = vms.find((vm) => String(vm['name'] ?? '') === name) ?? null;

        return Promise.resolve({
          vm: match,
        });
      }

      return Promise.resolve({
        vms: fixture.vms,
      });
    });

    process.env.UCLI_HOST = 'http://tower.local:7777';
    process.env.UCLI_API_KEY = 'test-api-key';
  });

  it('registers the vms command and all subcommands', () => {
    const program = createProgram();
    const vmsCommand = program.commands.find((command) => command.name() === 'vms');

    expect(vmsCommand).toBeDefined();
    expect(vmsCommand?.commands.map((command) => command.name())).toEqual([
      'list',
      'get',
      'status',
      'inspect',
      'start',
      'stop',
      'pause',
      'resume',
      'reboot',
      'reset',
      'force-stop',
    ]);
  });

  it('vms list shows all VMs with required fields', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'vms', 'list', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Array<Record<string, unknown>>;
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toMatchObject({
      name: 'ubuntu-dev',
      status: 'running',
      vcpus: 4,
      memory: '8.00 GB',
      diskSize: '64.00 GB',
    });
    expect(createClientMock).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: 'http://tower.local:7777/graphql',
      apiKey: 'test-api-key',
    }));
  });

  it('vms get shows detailed VM info by name', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'vms', 'get', 'ubuntu-dev', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed).toMatchObject({
      id: 'vm-101',
      name: 'ubuntu-dev',
      status: 'running',
      vcpus: 4,
      os: 'Ubuntu 24.04',
      autostart: true,
      ipAddress: '192.168.1.50',
    });
    expect(parsed.memory).toBe('8.00 GB');
    expect(parsed.diskSize).toBe('64.00 GB');
  });

  it('vms status shows summary counts and per-VM status', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'vms', 'status', '--output', 'json']);

    const parsed = JSON.parse(stdout) as {
      summary: Record<string, number>;
      vms: Array<Record<string, unknown>>;
    };

    expect(parsed.summary).toEqual({ running: 1, stopped: 1, paused: 1, other: 0 });
    expect(parsed.vms[1]).toMatchObject({
      name: 'win11',
      status: 'stopped',
      state: 'shut off',
    });
  });

  it('vms inspect shows raw VM inspect payload', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'vms', 'inspect', 'ubuntu-dev', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed).toEqual({
      cpu: {
        model: 'host-passthrough',
        sockets: 1,
        cores: 4,
      },
      devices: {
        disk: 'vda',
        network: 'virtio',
      },
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
      'vms',
      'list',
      '--output',
      'json',
      '--filter',
      'status=running',
      '--sort',
      'name:desc',
      '--page',
      '1',
      '--page-size',
      '1',
      '--fields',
      'name,status',
    ]);

    expect(JSON.parse(stdout)).toEqual([
      { name: 'ubuntu-dev', status: 'running' },
    ]);

    for (const format of ['yaml', 'table']) {
      const program = createProgram();
      stdout = '';
      process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
        stdout += String(chunk);
        return true;
      });

      await program.parseAsync(['node', 'ucli', 'vms', 'status', '--output', format]);
      expect(stdout.length).toBeGreaterThan(0);
    }
  });
});
