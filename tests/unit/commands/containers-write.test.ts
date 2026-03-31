import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../../src/cli/index.js';

const { executeMock, createClientMock } = vi.hoisted(() => {
  const execute = vi.fn();
  const createClient = vi.fn(() => ({
    execute,
    requestId: 'req-containers-write-test',
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

describe('containers write commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const states = new Map<string, string>([
      ['nginx', 'running'],
      ['redis', 'paused'],
      ['postgres', 'stopped'],
    ]);

    executeMock.mockImplementation((document: string, variables?: { name?: string }) => {
      const name = variables?.name ?? 'nginx';

      if (document.includes('mutation DockerStart')) {
        states.set(name, 'running');
        return Promise.resolve({ docker: { start: { success: true, message: `started ${name}` } } });
      }

      if (document.includes('mutation DockerStop')) {
        states.set(name, 'stopped');
        return Promise.resolve({ docker: { stop: { success: true, message: `stopped ${name}` } } });
      }

      if (document.includes('mutation DockerPause')) {
        states.set(name, 'paused');
        return Promise.resolve({ docker: { pause: { success: true, message: `paused ${name}` } } });
      }

      if (document.includes('mutation DockerUnpause')) {
        states.set(name, 'running');
        return Promise.resolve({ docker: { unpause: { success: true, message: `unpaused ${name}` } } });
      }

      if (document.includes('mutation DockerRemoveContainer')) {
        states.delete(name);
        return Promise.resolve({ docker: { removeContainer: { success: true, message: `removed ${name}` } } });
      }

      if (document.includes('query DockerContainer')) {
        const state = states.get(name);
        return Promise.resolve({
          docker: {
            container: state == null
              ? null
              : {
                id: `${name}-id`,
                name: `/${name}`,
                image: `${name}:latest`,
                status: state,
                state,
                command: null,
                createdAt: null,
                startedAt: null,
                uptime: null,
                ports: [],
                logs: null,
                inspect: null,
                stats: null,
              },
          },
        });
      }

      return Promise.resolve({ docker: { containers: [] } });
    });

    process.env.UCLI_HOST = 'http://tower.local:7777';
    process.env.UCLI_API_KEY = 'test-api-key';
  });

  it('registers write subcommands under containers', () => {
    const program = createProgram();
    const containersCommand = program.commands.find((command) => command.name() === 'containers');

    expect(containersCommand?.commands.map((command) => command.name())).toEqual([
      'list',
      'get',
      'status',
      'inspect',
      'logs',
      'stats',
      'start',
      'stop',
      'restart',
      'pause',
      'unpause',
      'remove',
    ]);
  });

  it.each([
    ['start', 'postgres', 'running', 'mutation DockerStart'],
    ['stop', 'nginx', 'stopped', 'mutation DockerStop'],
    ['pause', 'nginx', 'paused', 'mutation DockerPause'],
    ['unpause', 'redis', 'running', 'mutation DockerUnpause'],
  ])('executes %s with S1 safety and shows new state', async (cmd, name, expectedState, mutationText) => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'containers', cmd, name, '--yes', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed).toMatchObject({ name, state: expectedState, success: true });
    expect(executeMock).toHaveBeenCalledWith(expect.stringContaining(mutationText), { name });
  });

  it('executes restart as stop then start', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'containers', 'restart', 'nginx', '--yes', '--output', 'json']);

    const docs = executeMock.mock.calls.map((call) => String(call[0]));
    const stopIndex = docs.findIndex((doc) => doc.includes('mutation DockerStop'));
    const startIndex = docs.findIndex((doc) => doc.includes('mutation DockerStart'));

    expect(stopIndex).toBeGreaterThanOrEqual(0);
    expect(startIndex).toBeGreaterThan(stopIndex);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed).toMatchObject({ name: 'nginx', state: 'running', success: true });
  });

  it('requires --yes for S1 commands when non-interactive', async () => {
    const program = createProgram();
    const originalTty = process.stdout.isTTY;
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: false,
    });

    await expect(
      program.parseAsync(['node', 'ucli', 'containers', 'start', 'postgres', '--output', 'json']),
    ).rejects.toMatchObject({ exitCode: 10 });

    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: originalTty,
    });
  });

  it('requires --yes and --force for remove (S3)', async () => {
    const program = createProgram();

    await expect(
      program.parseAsync(['node', 'ucli', 'containers', 'remove', 'postgres', '--yes', '--output', 'json']),
    ).rejects.toMatchObject({ exitCode: 10 });
  });

  it('remove succeeds with --yes --force and reports removed state', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'containers', 'remove', 'postgres', '--yes', '--force', '--output', 'json']);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed).toMatchObject({ name: 'postgres', state: 'removed', success: true });
    expect(executeMock).toHaveBeenCalledWith(expect.stringContaining('mutation DockerRemoveContainer'), { name: 'postgres' });
  });
});
