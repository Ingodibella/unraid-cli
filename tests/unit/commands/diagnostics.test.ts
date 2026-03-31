import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram, main } from '../../../src/cli/index.js';

const { executeMock, createClientMock, fetchSchemaIntrospectionMock } = vi.hoisted(() => {
  const execute = vi.fn();
  const createClient = vi.fn(() => ({
    execute,
    requestId: 'req-diagnostics-test',
  }));

  const fetchSchemaIntrospection = vi.fn();

  return {
    executeMock: execute,
    createClientMock: createClient,
    fetchSchemaIntrospectionMock: fetchSchemaIntrospection,
  };
});

vi.mock('../../../src/core/graphql/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/core/graphql/client.js')>();
  return {
    ...actual,
    createClient: createClientMock,
  };
});

vi.mock('../../../src/core/graphql/introspection.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/core/graphql/introspection.js')>();
  return {
    ...actual,
    fetchSchemaIntrospection: fetchSchemaIntrospectionMock,
  };
});

describe('diagnostics command group', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.UCLI_HOST = 'http://tower.local:7777';
    process.env.UCLI_API_KEY = 'test-api-key';
    delete process.env.UCLI_PROFILE;
    delete process.env.UCLI_CONFIG;

    executeMock.mockImplementation((document: string) => {
      if (document.includes('DiagnosticsPermissions')) {
        return Promise.resolve({
          me: {
            id: 'u1',
            username: 'root',
            email: 'root@tower.local',
            roles: ['ADMIN'],
            permissions: ['system.read', 'docker.read'],
          },
        });
      }

      if (document.includes('DiagnosticsDoctorPermissions')) {
        return Promise.resolve({
          me: {
            roles: ['ADMIN'],
          },
        });
      }

      return Promise.resolve({
        info: {
          osPlatform: 'Linux',
        },
      });
    });

    fetchSchemaIntrospectionMock.mockResolvedValue({
      __schema: {
        types: [],
      },
    });
  });

  it('registers diagnostics subcommands', () => {
    const program = createProgram();
    const diagnosticsCommand = program.commands.find((command) => command.name() === 'diagnostics');

    expect(diagnosticsCommand).toBeDefined();
    expect(diagnosticsCommand?.commands.map((command) => command.name())).toEqual([
      'doctor',
      'ping',
      'latency',
      'permissions',
      'env',
      'graphql',
    ]);
  });

  it('doctor runs checks in sequence and reports pass state', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'diagnostics', 'doctor', '--output', 'json']);

    const parsed = JSON.parse(stdout) as {
      ok: boolean;
      checks: Array<{ name: string; ok: boolean }>;
    };

    expect(parsed.ok).toBe(true);
    expect(parsed.checks.map((check) => check.name)).toEqual([
      'config',
      'auth',
      'connectivity',
      'schema',
      'permissions',
    ]);
    expect(parsed.checks.every((check) => check.ok)).toBe(true);
    expect(executeMock.mock.calls[0]?.[0]).toContain('DiagnosticsDoctorConnectivity');
    expect(fetchSchemaIntrospectionMock).toHaveBeenCalledTimes(1);
    expect(executeMock.mock.calls[1]?.[0]).toContain('DiagnosticsDoctorPermissions');
  });

  it('ping succeeds and reports latency', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'diagnostics', 'ping', '--output', 'json']);

    const parsed = JSON.parse(stdout) as { ok: boolean; latencyMs: number };
    expect(parsed.ok).toBe(true);
    expect(typeof parsed.latencyMs).toBe('number');
  });

  it('ping failure exits with code 7', async () => {
    executeMock.mockRejectedValueOnce(new Error('network down'));

    const stderrWrite = vi.fn();
    const exit = vi.fn();

    await main(['node', 'ucli', 'diagnostics', 'ping', '--output', 'json'], {
      run: (argv) => createProgram().parseAsync(argv),
      stderrWrite,
      exit,
    });

    expect(stderrWrite).toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(7);
  });

  it('latency reports five samples with min max avg p95', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'diagnostics', 'latency', '--output', 'json']);

    const parsed = JSON.parse(stdout) as {
      samples: number[];
      minMs: number;
      maxMs: number;
      avgMs: number;
      p95Ms: number;
    };

    expect(parsed.samples).toHaveLength(5);
    expect(parsed.minMs).toBeLessThanOrEqual(parsed.maxMs);
    expect(parsed.avgMs).toBeGreaterThanOrEqual(parsed.minMs);
    expect(parsed.p95Ms).toBeGreaterThanOrEqual(parsed.minMs);
  });

  it('permissions shows me roles and permissions', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'diagnostics', 'permissions', '--output', 'json']);

    const parsed = JSON.parse(stdout) as {
      me: {
        roles: string[];
        permissions: string[];
      };
    };

    expect(parsed.me.roles).toEqual(['ADMIN']);
    expect(parsed.me.permissions).toContain('system.read');
  });

  it('env masks api keys in resolved output', async () => {
    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync(['node', 'ucli', 'diagnostics', 'env', '--output', 'json']);

    const parsed = JSON.parse(stdout) as {
      apiKeyMasked: string;
      env: {
        UCLI_API_KEY: string;
      };
    };

    expect(parsed.apiKeyMasked).not.toContain('test-api-key');
    expect(parsed.env.UCLI_API_KEY).not.toContain('test-api-key');
    expect(parsed.apiKeyMasked.length).toBeGreaterThan(0);
  });

  it('graphql executes raw query from file', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'ucli-diagnostics-'));
    const queryFile = join(tempDir, 'raw.graphql');
    writeFileSync(queryFile, 'query Raw { info { osPlatform } }\n', 'utf8');

    const program = createProgram();
    let stdout = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      stdout += String(chunk);
      return true;
    });

    await program.parseAsync([
      'node',
      'ucli',
      'diagnostics',
      'graphql',
      '--query',
      queryFile,
      '--output',
      'json',
    ]);

    const parsed = JSON.parse(stdout) as { info: { osPlatform: string } };
    expect(parsed.info.osPlatform).toBe('Linux');
    expect(executeMock).toHaveBeenCalledWith(expect.stringContaining('query Raw'));
  });
});
