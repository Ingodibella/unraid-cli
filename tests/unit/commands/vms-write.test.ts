import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram, main } from '../../../src/cli/index.js';

const { executeMock, createClientMock } = vi.hoisted(() => {
  const execute = vi.fn();
  const createClient = vi.fn(() => ({
    execute,
    requestId: 'req-vms-write-test',
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

describe('vms write commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const vmState = new Map<string, { name: string; status: string; state: string }>([
      ['ubuntu-dev', { name: 'ubuntu-dev', status: 'stopped', state: 'shut off' }],
    ]);

    executeMock.mockImplementation((document: string, variables?: { name?: string }) => {
      const name = variables?.name ?? 'ubuntu-dev';
      const current = vmState.get(name) ?? { name, status: 'stopped', state: 'shut off' };

      if (document.includes('mutation VmStart')) {
        vmState.set(name, { name, status: 'running', state: 'running' });
        return Promise.resolve({ vmMutations: { start: { success: true, message: null } } });
      }

      if (document.includes('mutation VmStop')) {
        vmState.set(name, { name, status: 'stopped', state: 'shut off' });
        return Promise.resolve({ vmMutations: { stop: { success: true, message: null } } });
      }

      if (document.includes('mutation VmPause')) {
        vmState.set(name, { name, status: 'paused', state: 'paused' });
        return Promise.resolve({ vmMutations: { pause: { success: true, message: null } } });
      }

      if (document.includes('mutation VmResume')) {
        vmState.set(name, { name, status: 'running', state: 'running' });
        return Promise.resolve({ vmMutations: { resume: { success: true, message: null } } });
      }

      if (document.includes('mutation VmReboot')) {
        vmState.set(name, { name, status: 'running', state: 'running' });
        return Promise.resolve({ vmMutations: { reboot: { success: true, message: null } } });
      }

      if (document.includes('mutation VmReset')) {
        vmState.set(name, { name, status: 'running', state: 'running' });
        return Promise.resolve({ vmMutations: { reset: { success: true, message: null } } });
      }

      if (document.includes('mutation VmForceStop')) {
        vmState.set(name, { name, status: 'stopped', state: 'shut off' });
        return Promise.resolve({ vmMutations: { forceStop: { success: true, message: null } } });
      }

      if (document.includes('vm(name: $name)')) {
        return Promise.resolve({ vm: current });
      }

      return Promise.resolve({
        vms: Array.from(vmState.values()),
      });
    });

    process.env.UCLI_HOST = 'http://tower.local:7777';
    process.env.UCLI_API_KEY = 'test-api-key';
  });

  it('registers all VM write subcommands', () => {
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

  it.each([
    ['start', 'mutation VmStart'],
    ['stop', 'mutation VmStop'],
    ['pause', 'mutation VmPause'],
    ['resume', 'mutation VmResume'],
    ['reboot', 'mutation VmReboot'],
    ['reset', 'mutation VmReset'],
    ['force-stop', 'mutation VmForceStop'],
  ])('runs %s with the correct mutation and returns new state', async (commandName, mutationName) => {
    const program = createProgram();
    let stdout = '';

    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    const args = ['node', 'ucli', '--yes', 'vms', commandName, 'ubuntu-dev', '--output', 'json'];
    if (commandName === 'reset' || commandName === 'force-stop') {
      args.splice(3, 0, '--force');
    }

    await program.parseAsync(args);

    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed['name']).toBe('ubuntu-dev');
    expect(parsed['state']).toBeTypeOf('string');

    expect(
      executeMock.mock.calls.some(([document]) => String(document).includes(mutationName)),
    ).toBe(true);
    expect(createClientMock).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: 'http://tower.local:7777/graphql',
      apiKey: 'test-api-key',
    }));
  });

  it('returns exit code 10 for missing S1 confirmation flags', async () => {
    let stderr = '';
    const stderrWrite = vi.fn((chunk: string | Uint8Array) => {
      stderr += String(chunk);
      return true;
    });
    const exit = vi.fn();

    await main(['node', 'ucli', 'vms', 'start', 'ubuntu-dev'], {
      run: (argv) => createProgram().parseAsync(argv),
      stderrWrite,
      exit: exit as typeof process.exit,
    });

    expect(exit).toHaveBeenCalledWith(10);
    expect(stderr).toContain('Confirmation required for vms.start. Re-run with --yes.');
  });

  it('returns exit code 10 for missing S2 --yes', async () => {
    let stderr = '';
    const stderrWrite = vi.fn((chunk: string | Uint8Array) => {
      stderr += String(chunk);
      return true;
    });
    const exit = vi.fn();

    await main(['node', 'ucli', 'vms', 'reboot', 'ubuntu-dev'], {
      run: (argv) => createProgram().parseAsync(argv),
      stderrWrite,
      exit: exit as typeof process.exit,
    });

    expect(exit).toHaveBeenCalledWith(10);
    expect(stderr).toContain('Critical action vms.reboot requires --yes.');
  });

  it('returns exit code 10 for missing S3 --force', async () => {
    let stderr = '';
    const stderrWrite = vi.fn((chunk: string | Uint8Array) => {
      stderr += String(chunk);
      return true;
    });
    const exit = vi.fn();

    await main(['node', 'ucli', '--yes', 'vms', 'reset', 'ubuntu-dev'], {
      run: (argv) => createProgram().parseAsync(argv),
      stderrWrite,
      exit: exit as typeof process.exit,
    });

    expect(exit).toHaveBeenCalledWith(10);
    expect(stderr).toContain('Destructive action vms.reset requires both --yes and --force.');
  });
});
