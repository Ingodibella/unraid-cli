import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../../src/cli/index.js';

const { executeMock, createClientMock } = vi.hoisted(() => {
  const execute = vi.fn();
  const createClient = vi.fn(() => ({
    execute,
    requestId: 'req-array-write-test',
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

describe('array write commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.UCLI_HOST = 'http://tower.local:7777';
    process.env.UCLI_API_KEY = 'test-api-key';
  });

  it('registers start and stop on array command', () => {
    const program = createProgram();
    const arrayCommand = program.commands.find((command) => command.name() === 'array');
    const names = arrayCommand?.commands.map((command) => command.name()) ?? [];

    expect(names).toContain('start');
    expect(names).toContain('stop');
  });

  it('registers parity check write lifecycle commands', () => {
    const program = createProgram();
    const arrayCommand = program.commands.find((command) => command.name() === 'array');
    const parityCommand = arrayCommand?.commands.find((command) => command.name() === 'parity');
    const checkCommand = parityCommand?.commands.find((command) => command.name() === 'check');

    expect(checkCommand).toBeDefined();
    const names = checkCommand?.commands.map((command) => command.name()) ?? [];
    expect(names).toEqual(expect.arrayContaining(['start', 'pause', 'resume', 'cancel']));
  });

  it('executes array start mutation with --yes', async () => {
    executeMock.mockResolvedValue({
      array: { startArray: 'STARTED' },
    });

    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'array', 'start', '--yes', '--output', 'json']);

    expect(executeMock).toHaveBeenCalledWith(expect.stringContaining('mutation ArrayStart'));
    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed.action).toBe('start');
    expect(parsed.state).toBe('STARTED');
  });

  it('requires --yes for array stop (S2)', async () => {
    const program = createProgram();

    await expect(
      program.parseAsync(['node', 'ucli', 'array', 'stop', '--output', 'json']),
    ).rejects.toMatchObject({
      exitCode: 10,
      message: 'Critical action array.stop requires --yes.',
    });

    expect(executeMock).not.toHaveBeenCalled();
  });

  it('executes parity check start, pause, resume with --yes', async () => {
    executeMock
      .mockResolvedValueOnce({ parityCheck: { start: { status: 'running', progress: 0, errors: 0, running: true, paused: false, correcting: false } } })
      .mockResolvedValueOnce({ parityCheck: { pause: { status: 'paused', progress: 10, errors: 0, running: false, paused: true, correcting: false } } })
      .mockResolvedValueOnce({ parityCheck: { resume: { status: 'running', progress: 10, errors: 0, running: true, paused: false, correcting: false } } });

    const program = createProgram();

    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });
    await program.parseAsync(['node', 'ucli', 'array', 'parity', 'check', 'start', '--yes', '--output', 'json']);
    expect(JSON.parse(stdout).action).toBe('start');

    stdout = '';
    await program.parseAsync(['node', 'ucli', 'array', 'parity', 'check', 'pause', '--yes', '--output', 'json']);
    expect(JSON.parse(stdout).action).toBe('pause');

    stdout = '';
    await program.parseAsync(['node', 'ucli', 'array', 'parity', 'check', 'resume', '--yes', '--output', 'json']);
    expect(JSON.parse(stdout).action).toBe('resume');

    expect(executeMock).toHaveBeenNthCalledWith(1, expect.stringContaining('mutation ParityCheckStart'));
    expect(executeMock).toHaveBeenNthCalledWith(2, expect.stringContaining('mutation ParityCheckPause'));
    expect(executeMock).toHaveBeenNthCalledWith(3, expect.stringContaining('mutation ParityCheckResume'));
  });

  it('requires --yes for parity cancel (S2) and executes with --yes', async () => {
    const program = createProgram();

    await expect(
      program.parseAsync(['node', 'ucli', 'array', 'parity', 'check', 'cancel', '--output', 'json']),
    ).rejects.toMatchObject({
      exitCode: 10,
      message: 'Critical action parity.cancel requires --yes.',
    });

    executeMock.mockResolvedValueOnce({
      parityCheck: {
        cancel: { status: 'cancelled', progress: 11, errors: 0, running: false, paused: false, correcting: false },
      },
    });

    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'array', 'parity', 'check', 'cancel', '--yes', '--output', 'json']);

    expect(executeMock).toHaveBeenLastCalledWith(expect.stringContaining('mutation ParityCheckCancel'));
    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed.action).toBe('cancel');
    expect(parsed.warning).toBe('Parity check was cancelled before completion.');
  });
});
