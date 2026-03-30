import { describe, it, expect } from 'vitest';
import {
  resolveGlobalOptions,
  OUTPUT_FORMATS,
  DEFAULTS,
  type GlobalOptions,
  type OutputFormat,
} from '../../../src/cli/globals.js';

describe('globals', () => {
  describe('OUTPUT_FORMATS', () => {
    it('contains all four supported formats', () => {
      expect(OUTPUT_FORMATS).toEqual(['human', 'json', 'yaml', 'table']);
    });

    it('is readonly (frozen at type level)', () => {
      expect(OUTPUT_FORMATS).toHaveLength(4);
    });
  });

  describe('DEFAULTS', () => {
    it('has correct default output format', () => {
      expect(DEFAULTS.output).toBe('human');
    });

    it('has correct default timeout', () => {
      expect(DEFAULTS.timeout).toBe(30);
    });

    it('has correct default retry count', () => {
      expect(DEFAULTS.retry).toBe(3);
    });

    it('has correct default page size', () => {
      expect(DEFAULTS.pageSize).toBe(25);
    });
  });

  describe('resolveGlobalOptions', () => {
    it('returns defaults when given an empty object', () => {
      const opts = resolveGlobalOptions({});

      expect(opts.output).toBe('human');
      expect(opts.timeout).toBe(30);
      expect(opts.retry).toBe(3);
      expect(opts.host).toBeUndefined();
      expect(opts.apiKey).toBeUndefined();
      expect(opts.profile).toBeUndefined();
      expect(opts.debug).toBeUndefined();
      expect(opts.verbose).toBeUndefined();
      expect(opts.quiet).toBeUndefined();
      expect(opts.yes).toBeUndefined();
      expect(opts.force).toBeUndefined();
      expect(opts.noColor).toBeUndefined();
    });

    it('extracts connection options correctly', () => {
      const opts = resolveGlobalOptions({
        host: 'http://192.168.1.10:7777',
        apiKey: 'my-secret-key',
        profile: 'home',
      });

      expect(opts.host).toBe('http://192.168.1.10:7777');
      expect(opts.apiKey).toBe('my-secret-key');
      expect(opts.profile).toBe('home');
    });

    it('validates output format and accepts valid values', () => {
      for (const format of OUTPUT_FORMATS) {
        const opts = resolveGlobalOptions({ output: format });
        expect(opts.output).toBe(format);
      }
    });

    it('falls back to default for invalid output format', () => {
      const opts = resolveGlobalOptions({ output: 'csv' });
      expect(opts.output).toBe('human');
    });

    it('falls back to default for undefined output format', () => {
      const opts = resolveGlobalOptions({});
      expect(opts.output).toBe('human');
    });

    it('parses numeric values for page and pageSize', () => {
      const opts = resolveGlobalOptions({ page: 3, pageSize: 50 });
      expect(opts.page).toBe(3);
      expect(opts.pageSize).toBe(50);
    });

    it('handles numeric values passed as strings', () => {
      const opts = resolveGlobalOptions({ page: '2', pageSize: '10', timeout: '60', retry: '5' });
      expect(opts.page).toBe(2);
      expect(opts.pageSize).toBe(10);
      expect(opts.timeout).toBe(60);
      expect(opts.retry).toBe(5);
    });

    it('extracts boolean flags correctly', () => {
      const opts = resolveGlobalOptions({
        all: true,
        debug: true,
        verbose: true,
        quiet: true,
        yes: true,
        force: true,
        noColor: true,
      });

      expect(opts.all).toBe(true);
      expect(opts.debug).toBe(true);
      expect(opts.verbose).toBe(true);
      expect(opts.quiet).toBe(true);
      expect(opts.yes).toBe(true);
      expect(opts.force).toBe(true);
      expect(opts.noColor).toBe(true);
    });

    it('extracts filter and sort strings', () => {
      const opts = resolveGlobalOptions({
        filter: 'status=running',
        sort: 'name:asc',
        fields: 'name,status,size',
      });

      expect(opts.filter).toBe('status=running');
      expect(opts.sort).toBe('name:asc');
      expect(opts.fields).toBe('name,status,size');
    });

    it('returns type-safe GlobalOptions object', () => {
      const opts: GlobalOptions = resolveGlobalOptions({
        host: 'http://localhost:7777',
        output: 'json',
        timeout: 10,
        retry: 1,
      });

      // Type assertion: this compiles only if the return type matches GlobalOptions
      const format: OutputFormat = opts.output;
      expect(format).toBe('json');
    });
  });
});
