import { describe, expect, it } from 'vitest';
import YAML from 'yaml';

import { parseFields, selectFields } from '../../../src/core/output/fields.js';
import { renderHuman } from '../../../src/core/output/human.js';
import { renderJson } from '../../../src/core/output/json.js';
import { renderOutput, resolveOutputFormat } from '../../../src/core/output/renderer.js';
import { renderTable } from '../../../src/core/output/table.js';
import { renderYaml } from '../../../src/core/output/yaml.js';

describe('field selection', () => {
  it('parses comma separated field lists', () => {
    expect(parseFields('name,status, system.temp')).toEqual(['name', 'status', 'system.temp']);
  });

  it('selects nested fields with dot notation', () => {
    const result = selectFields(
      {
        name: 'tower',
        status: 'running',
        system: {
          temp: 38,
          memory: 1024,
        },
      },
      'name,system.temp',
    );

    expect(result).toEqual({
      name: 'tower',
      system: {
        temp: 38,
      },
    });
  });

  it('applies field selection to array items', () => {
    const result = selectFields(
      [
        { name: 'disk1', status: 'running', size: 1024 },
        { name: 'disk2', status: 'stopped', size: 2048 },
      ],
      'name,status',
    );

    expect(result).toEqual([
      { name: 'disk1', status: 'running' },
      { name: 'disk2', status: 'stopped' },
    ]);
  });
});

describe('renderHuman', () => {
  it('renders compact key value pairs', () => {
    const result = renderHuman({
      name: 'tower',
      status: 'running',
      memory: 5 * 1024 ** 3,
      temp: 42,
    });

    expect(result).toContain('name: tower');
    expect(result).toContain('status: running');
    expect(result).toContain('memory: 5.00 GiB');
    expect(result).toContain('temp: 42 C');
  });

  it('strips ansi colors in no-color mode', () => {
    const result = renderHuman({ status: 'running' }, { noColor: true });
    expect(result).not.toMatch(/\u001b\[/);
  });

  it('suppresses array item numbering in quiet mode', () => {
    const result = renderHuman([{ name: 'tower', status: 'running' }], { quiet: true, noColor: true });
    expect(result).not.toContain('#1');
    expect(result).toContain('name: tower');
  });

  it('sanitizes terminal escape sequences in string values', () => {
    const result = renderHuman({ message: '\u001b[2J\u001b[Hspoof' }, { noColor: true });
    expect(result).toContain('message: spoof');
    expect(result).not.toContain('\u001b[');
  });
});

describe('structured renderers', () => {
  const data = {
    zebra: 'last',
    alpha: 'first',
    nested: {
      beta: 2,
      alpha: 1,
    },
  };

  it('renders stable json with two-space indentation', () => {
    const result = renderJson(data);
    expect(result).toBe(`{\n  "alpha": "first",\n  "nested": {\n    "alpha": 1,\n    "beta": 2\n  },\n  "zebra": "last"\n}\n`);
    expect(JSON.parse(result)).toEqual(data);
  });

  it('renders yaml that parses back to the same data', () => {
    const result = renderYaml(data);
    expect(YAML.parse(result)).toEqual(data);
  });

  it('renders arrays as a table with columns', () => {
    const result = renderTable([
      { name: 'disk1', status: 'running' },
      { name: 'disk2', status: 'stopped' },
    ]);

    expect(result).toContain('name');
    expect(result).toContain('status');
    expect(result).toContain('disk1');
    expect(result).toContain('disk2');
  });

  it('sanitizes terminal escape sequences in table cells', () => {
    const result = renderTable([{ message: '\u001b]52;c;SGVsbG8=\u0007payload' }]);
    expect(result).toContain('payload');
    expect(result).not.toContain(']52;c;SGVsbG8=');
  });
});

describe('renderOutput', () => {
  it('prefers an explicit output format over tty detection', () => {
    const result = renderOutput({ zebra: 'last', alpha: 'first' }, {
      format: 'yaml',
      stdoutIsTTY: false,
    });

    expect(result).toContain('alpha: first');
    expect(result).toContain('zebra: last');
  });

  it('uses human output for tty stdout by default', () => {
    const result = renderOutput({ name: 'tower', status: 'running' }, { stdoutIsTTY: true, noColor: true });
    expect(result).toContain('name: tower');
  });

  it('uses json output for piped stdout by default', () => {
    const result = renderOutput({ name: 'tower', status: 'running' }, { stdoutIsTTY: false });
    expect(JSON.parse(result)).toEqual({ name: 'tower', status: 'running' });
  });

  it('applies field selection before rendering', () => {
    const result = renderOutput(
      {
        name: 'tower',
        status: 'running',
        system: { temp: 40, fans: 3 },
      },
      {
        format: 'json',
        fields: 'name,system.temp',
      },
    );

    expect(JSON.parse(result)).toEqual({
      name: 'tower',
      system: { temp: 40 },
    });
  });

  it('keeps json mode free of prose on stdout', () => {
    const result = renderOutput({ name: 'tower' }, { format: 'json', quiet: true });
    expect(result).toBe(`{\n  "name": "tower"\n}\n`);
  });
});

describe('resolveOutputFormat', () => {
  it('resolves explicit format first', () => {
    expect(resolveOutputFormat({ format: 'table', stdoutIsTTY: false })).toBe('table');
  });

  it('falls back to tty detection', () => {
    expect(resolveOutputFormat({ stdoutIsTTY: true })).toBe('human');
    expect(resolveOutputFormat({ stdoutIsTTY: false })).toBe('json');
  });
});
