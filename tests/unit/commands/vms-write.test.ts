import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../../src/cli/index.js';

const { executeMock, createClientMock } = vi.hoisted(() => {
  const execute = vi.fn();
  const createClient = vi.fn(() => ({ execute, requestId: 'req-vms-write-test' }));
  return { executeMock: execute, createClientMock: createClient };
});

vi.mock('../../../src/core/graphql/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/core/graphql/client.js')>();
  return { ...actual, createClient: createClientMock };
});

describe('vms write commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const vmState = new Map<string, { id: string; name: string; state: string }>([['vm-101', { id: 'vm-101', name: 'ubuntu-dev', state: 'SHUTOFF' }]]);

    executeMock.mockImplementation((document: string, variables?: { id?: string }) => {
      const id = variables?.id ?? 'vm-101';
      if (document.includes('mutation VmStart')) vmState.set(id, { id, name: 'ubuntu-dev', state: 'RUNNING' });
      if (document.includes('mutation VmStop')) vmState.set(id, { id, name: 'ubuntu-dev', state: 'SHUTOFF' });
      if (document.includes('mutation VmPause')) vmState.set(id, { id, name: 'ubuntu-dev', state: 'PAUSED' });
      if (document.includes('mutation VmResume')) vmState.set(id, { id, name: 'ubuntu-dev', state: 'RUNNING' });
      if (document.includes('mutation VmReboot')) vmState.set(id, { id, name: 'ubuntu-dev', state: 'RUNNING' });
      if (document.includes('mutation VmReset')) vmState.set(id, { id, name: 'ubuntu-dev', state: 'RUNNING' });
      if (document.includes('mutation VmForceStop')) vmState.set(id, { id, name: 'ubuntu-dev', state: 'SHUTOFF' });
      return Promise.resolve({ vms: { domains: Array.from(vmState.values()), domain: null } });
    });

    process.env.UCLI_HOST = 'http://tower.local:7777';
    process.env.UCLI_API_KEY = 'test-api-key';
  });

  it.each(['start','stop','pause','resume','reboot','reset','force-stop'])('%s returns id and state', async (commandName) => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => ((stdout += String(chunk)), true));

    const args = ['node','ucli','--yes','vms',commandName,'vm-101','--output','json'];
    if (commandName === 'reset' || commandName === 'force-stop') args.splice(3,0,'--force');
    await program.parseAsync(args);

    expect(JSON.parse(stdout)).toMatchObject({ id: 'vm-101' });
  });
});
