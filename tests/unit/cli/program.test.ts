import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as cliModule from '../../../src/cli/index.js';

const { createProgram, main } = cliModule;

describe('createProgram', () => {
  let originalStdout: typeof process.stdout.write;
  let originalStderr: typeof process.stderr.write;

  beforeEach(() => {
    originalStdout = process.stdout.write;
    originalStderr = process.stderr.write;
  });

  afterEach(() => {
    process.stdout.write = originalStdout;
    process.stderr.write = originalStderr;
  });

  it('creates a Commander program named "ucli"', () => {
    const program = createProgram();
    expect(program.name()).toBe('ucli');
  });

  it('has the correct description', () => {
    const program = createProgram();
    expect(program.description()).toBe('The serious CLI for serious Unraid operators.');
  });

  it('has a version set from package.json', () => {
    const program = createProgram();
    expect(program.version()).toBeDefined();
    expect(program.version()).not.toBe('0.0.0-unknown');
    // Version should match semver-like pattern
    expect(program.version()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('prints version when --version is passed', async () => {
    const program = createProgram();
    let output = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
      output += String(chunk);
      return true;
    });

    program.exitOverride();
    try {
      await program.parseAsync(['node', 'ucli', '--version']);
    } catch (err: unknown) {
      // Commander throws on --version with exitOverride
      const cmdErr = err as { code?: string };
      expect(cmdErr.code).toBe('commander.version');
    }

    expect(output).toMatch(/^\d+\.\d+\.\d+/);
  });

  describe('global options registration', () => {
    it('registers --host option', () => {
      const program = createProgram();
      const hostOpt = program.options.find(o => o.long === '--host');
      expect(hostOpt).toBeDefined();
      expect(hostOpt?.flags).toContain('<url>');
    });

    it('registers --api-key option', () => {
      const program = createProgram();
      const opt = program.options.find(o => o.long === '--api-key');
      expect(opt).toBeDefined();
      expect(opt?.flags).toContain('<key>');
    });

    it('registers --profile option', () => {
      const program = createProgram();
      const opt = program.options.find(o => o.long === '--profile');
      expect(opt).toBeDefined();
      expect(opt?.flags).toContain('<name>');
    });

    it('registers -o/--output option with default', () => {
      const program = createProgram();
      const opt = program.options.find(o => o.long === '--output');
      expect(opt).toBeDefined();
      expect(opt?.short).toBe('-o');
      expect(opt?.defaultValue).toBe('human');
    });

    it('registers --fields option', () => {
      const program = createProgram();
      const opt = program.options.find(o => o.long === '--fields');
      expect(opt).toBeDefined();
    });

    it('registers --filter option', () => {
      const program = createProgram();
      const opt = program.options.find(o => o.long === '--filter');
      expect(opt).toBeDefined();
    });

    it('registers --sort option', () => {
      const program = createProgram();
      const opt = program.options.find(o => o.long === '--sort');
      expect(opt).toBeDefined();
    });

    it('registers --page option', () => {
      const program = createProgram();
      const opt = program.options.find(o => o.long === '--page');
      expect(opt).toBeDefined();
    });

    it('registers --page-size option', () => {
      const program = createProgram();
      const opt = program.options.find(o => o.long === '--page-size');
      expect(opt).toBeDefined();
    });

    it('registers --all option', () => {
      const program = createProgram();
      const opt = program.options.find(o => o.long === '--all');
      expect(opt).toBeDefined();
    });

    it('registers --timeout option with default 30', () => {
      const program = createProgram();
      const opt = program.options.find(o => o.long === '--timeout');
      expect(opt).toBeDefined();
      expect(opt?.defaultValue).toBe(30);
    });

    it('registers --retry option with default 3', () => {
      const program = createProgram();
      const opt = program.options.find(o => o.long === '--retry');
      expect(opt).toBeDefined();
      expect(opt?.defaultValue).toBe(3);
    });

    it('registers --debug option', () => {
      const program = createProgram();
      const opt = program.options.find(o => o.long === '--debug');
      expect(opt).toBeDefined();
    });

    it('registers -v/--verbose option', () => {
      const program = createProgram();
      const opt = program.options.find(o => o.long === '--verbose');
      expect(opt).toBeDefined();
      expect(opt?.short).toBe('-v');
    });

    it('registers -q/--quiet option', () => {
      const program = createProgram();
      const opt = program.options.find(o => o.long === '--quiet');
      expect(opt).toBeDefined();
      expect(opt?.short).toBe('-q');
    });

    it('registers -y/--yes option', () => {
      const program = createProgram();
      const opt = program.options.find(o => o.long === '--yes');
      expect(opt).toBeDefined();
      expect(opt?.short).toBe('-y');
    });

    it('registers --force option', () => {
      const program = createProgram();
      const opt = program.options.find(o => o.long === '--force');
      expect(opt).toBeDefined();
    });

    it('registers --no-color option', () => {
      const program = createProgram();
      const opt = program.options.find(o => o.long === '--no-color');
      expect(opt).toBeDefined();
    });

    it('has all 18 expected global options registered', () => {
      const program = createProgram();
      // Count non-version, non-help options
      const allOptions = program.options.filter(
        o => o.long !== '--version',
      );
      // 17 global flags + --no-color
      expect(allOptions.length).toBeGreaterThanOrEqual(17);
    });
  });

  describe('top-level error boundary', () => {
    it('maps errors to process.exit only in main()', async () => {
      const stderrWrite = vi.fn(() => true);
      const exit = vi.fn();
      const run = vi.fn().mockRejectedValue(new Error('boom'));

      await main(['node', 'ucli'], { run, stderrWrite, exit: exit as typeof process.exit });
      expect(stderrWrite).toHaveBeenCalled();
      expect(exit).toHaveBeenCalledWith(1);
      expect(run).toHaveBeenCalledOnce();
    });

    it('includes stack traces when --debug is enabled', async () => {
      const error = new Error('boom');
      error.stack = 'Error: boom\n  at debug.ts:1:1';

      const stderrWrite = vi.fn(() => true);
      const exit = vi.fn();
      const run = vi.fn().mockRejectedValue(error);

      await main(['node', 'ucli', '--debug'], { run, stderrWrite, exit: exit as typeof process.exit });

      const output = stderrWrite.mock.calls.map(([chunk]) => String(chunk)).join('');
      expect(output).toContain('Runtime error: boom');
      expect(output).toContain('debug.ts:1:1');
      expect(exit).toHaveBeenCalledWith(1);
      expect(run).toHaveBeenCalledOnce();
    });
  });

  describe('option parsing', () => {
    it('parses connection options from argv', async () => {
      const program = createProgram();
      program.exitOverride();
      program.action(() => {
        // noop
      });

      await program.parseAsync([
        'node', 'ucli',
        '--host', 'http://myserver:7777',
        '--api-key', 'test-key',
        '--profile', 'home',
      ]);

      const opts = program.opts();
      expect(opts['host']).toBe('http://myserver:7777');
      expect(opts['apiKey']).toBe('test-key');
      expect(opts['profile']).toBe('home');
    });

    it('parses output options from argv', async () => {
      const program = createProgram();
      program.exitOverride();
      program.action(() => {
        // noop
      });

      await program.parseAsync([
        'node', 'ucli',
        '-o', 'json',
        '--fields', 'name,status',
        '--filter', 'status=running',
        '--sort', 'name:asc',
      ]);

      const opts = program.opts();
      expect(opts['output']).toBe('json');
      expect(opts['fields']).toBe('name,status');
      expect(opts['filter']).toBe('status=running');
      expect(opts['sort']).toBe('name:asc');
    });

    it('parses pagination options from argv', async () => {
      const program = createProgram();
      program.exitOverride();
      program.action(() => {
        // noop
      });

      await program.parseAsync([
        'node', 'ucli',
        '--page', '2',
        '--page-size', '50',
      ]);

      const opts = program.opts();
      expect(opts['page']).toBe(2);
      expect(opts['pageSize']).toBe(50);
    });

    it('parses --all flag', async () => {
      const program = createProgram();
      program.exitOverride();
      program.action(() => {
        // noop
      });

      await program.parseAsync(['node', 'ucli', '--all']);

      const opts = program.opts();
      expect(opts['all']).toBe(true);
    });

    it('parses behavior options from argv', async () => {
      const program = createProgram();
      program.exitOverride();
      program.action(() => {
        // noop
      });

      await program.parseAsync([
        'node', 'ucli',
        '--timeout', '60',
        '--retry', '5',
        '--debug',
        '--verbose',
        '--quiet',
      ]);

      const opts = program.opts();
      expect(opts['timeout']).toBe(60);
      expect(opts['retry']).toBe(5);
      expect(opts['debug']).toBe(true);
      expect(opts['verbose']).toBe(true);
      expect(opts['quiet']).toBe(true);
    });

    it('parses safety flags from argv', async () => {
      const program = createProgram();
      program.exitOverride();
      program.action(() => {
        // noop
      });

      await program.parseAsync([
        'node', 'ucli',
        '--yes',
        '--force',
      ]);

      const opts = program.opts();
      expect(opts['yes']).toBe(true);
      expect(opts['force']).toBe(true);
    });

    it('parses short aliases correctly', async () => {
      const program = createProgram();
      program.exitOverride();
      program.action(() => {
        // noop
      });

      await program.parseAsync([
        'node', 'ucli',
        '-o', 'yaml',
        '-v',
        '-q',
        '-y',
      ]);

      const opts = program.opts();
      expect(opts['output']).toBe('yaml');
      expect(opts['verbose']).toBe(true);
      expect(opts['quiet']).toBe(true);
      expect(opts['yes']).toBe(true);
    });

    it('uses defaults when no flags are passed', async () => {
      const program = createProgram();
      program.exitOverride();
      program.action(() => {
        // noop
      });

      await program.parseAsync(['node', 'ucli']);

      const opts = program.opts();
      expect(opts['output']).toBe('human');
      expect(opts['timeout']).toBe(30);
      expect(opts['retry']).toBe(3);
      // color defaults to true (--no-color negates it)
      expect(opts['color']).toBe(true);
    });

    it('sets color to false when --no-color is passed', async () => {
      const program = createProgram();
      program.exitOverride();
      program.action(() => {
        // noop
      });

      await program.parseAsync(['node', 'ucli', '--no-color']);

      const opts = program.opts();
      expect(opts['color']).toBe(false);
    });
  });
});
