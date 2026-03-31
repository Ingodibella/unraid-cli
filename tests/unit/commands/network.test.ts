import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../../src/cli/index.js';

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/fixtures/network-response.json'), 'utf8'),
) as Record<string, unknown>;

const { executeMock, createClientMock } = vi.hoisted(() => {
  const execute = vi.fn();
  const createClient = vi.fn(() => ({
    execute,
    requestId: 'req-network-test',
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

describe('network command group', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeMock.mockResolvedValue({ network: fixture.network });

    process.env.UCLI_HOST = 'http://tower.local:7777';
    process.env.UCLI_API_KEY = 'test-api-key';
  });

  it('registers the network command and all subcommands', () => {
    const program = createProgram();
    const networkCommand = program.commands.find((command) => command.name() === 'network');

    expect(networkCommand).toBeDefined();
    expect(networkCommand?.commands.map((command) => command.name())).toEqual([
      'status',
      'interfaces',
    ]);

    const interfacesCommand = networkCommand?.commands.find((command) => command.name() === 'interfaces');
    expect(interfacesCommand?.commands.map((command) => command.name())).toEqual([
      'list',
      'get',
    ]);
  });

  it('network status returns network overview', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'network', 'status', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed).toEqual({
      hostname: 'tower',
      gateway: '192.168.1.1',
      dns: ['1.1.1.1', '8.8.8.8'],
      interfaces: 3,
    });
  });

  it('network interfaces list returns interfaces', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'network', 'interfaces', 'list', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Array<Record<string, unknown>>;
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toMatchObject({
      name: 'eth0',
      status: 'up',
      ipv4: '192.168.1.10/24',
    });
  });

  it('network interfaces get returns one interface', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'network', 'interfaces', 'get', 'wg0', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed).toMatchObject({
      name: 'wg0',
      status: 'down',
      ipv4: '10.253.0.1/24',
      mtu: 1420,
    });
  });
});
