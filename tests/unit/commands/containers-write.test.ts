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
      ['docker:abc123', 'RUNNING'],
      ['docker:def456', 'PAUSED'],
      ['docker:ghi789', 'EXITED'],
    ]);

    const names = new Map<string, string>([
      ['docker:abc123', 'nginx'],
      ['docker:def456', 'redis'],
      ['docker:ghi789', 'postgres'],
    ]);

    const resolveId = (input: string) => {
      if (states.has(input)) {
        return input;
      }
      for (const [id, name] of names.entries()) {
        if (name === input) {
          return id;
        }
      }
      return input;
    };

    executeMock.mockImplementation((document: string, variables?: { id?: string }) => {
      const id = resolveId(variables?.id ?? 'docker:abc123');
      const name = names.get(id) ?? 'nginx';

      if (document.includes('mutation DockerStart')) {
        states.set(id, 'RUNNING');
        return Promise.resolve({ docker: { start: { id, names: [`/${name}`], state: 'RUNNING' } } });
      }

      if (document.includes('mutation DockerStop')) {
        states.set(id, 'EXITED');
        return Promise.resolve({ docker: { stop: { id, names: [`/${name}`], state: 'EXITED' } } });
      }

      if (document.includes('mutation DockerPause')) {
        states.set(id, 'PAUSED');
        return Promise.resolve({ docker: { pause: { id, names: [`/${name}`], state: 'PAUSED' } } });
      }

      if (document.includes('mutation DockerUnpause')) {
        states.set(id, 'RUNNING');
        return Promise.resolve({ docker: { unpause: { id, names: [`/${name}`], state: 'RUNNING' } } });
      }

      if (document.includes('mutation DockerRemove')) {
        states.delete(id);
        names.delete(id);
        return Promise.resolve({ docker: { remove: true } });
      }

      if (document.includes('query DockerSnapshot')) {
        return Promise.resolve({
          docker: {
            containers: [...states.entries()].map(([containerId, state]) => ({
              id: containerId,
              names: [`/${names.get(containerId) ?? containerId}`],
              image: `${names.get(containerId) ?? 'container'}:latest`,
              imageId: `sha256:${containerId}`,
              state,
              status: state,
              created: 0,
              ports: [],
              autoStart: true,
            })),
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
    ['start', 'postgres', 'RUNNING', 'mutation DockerStart'],
    ['stop', 'nginx', 'EXITED', 'mutation DockerStop'],
    ['pause', 'nginx', 'PAUSED', 'mutation DockerPause'],
    ['unpause', 'redis', 'RUNNING', 'mutation DockerUnpause'],
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
    expect(executeMock).toHaveBeenCalledWith(expect.stringContaining(mutationText), expect.objectContaining({ id: expect.any(String) }));
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
    expect(parsed).toMatchObject({ name: 'nginx', state: 'RUNNING', success: true });
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
    expect(parsed).toMatchObject({ name: 'postgres', state: 'REMOVED', success: true });
    expect(executeMock).toHaveBeenCalledWith(expect.stringContaining('mutation DockerRemove'), { id: 'docker:ghi789' });
  });
});
