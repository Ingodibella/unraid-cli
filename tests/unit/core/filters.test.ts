import { describe, expect, it } from 'vitest';

import {
  applyFilters,
  normalizeFilters,
  parseFilterExpressions,
  type FilterExpression,
} from '../../../src/core/filters/filter.js';
import { paginate, resolvePagination } from '../../../src/core/filters/paging.js';
import { applySort, parseSortExpressions } from '../../../src/core/filters/sort.js';

interface DiskRecord {
  name: string;
  status: string;
  size: number;
  stats: {
    temp: number;
    reads: number;
  };
}

const dataset: DiskRecord[] = [
  {
    name: 'cache',
    status: 'stopped',
    size: 512,
    stats: { temp: 31, reads: 20 },
  },
  {
    name: 'disk1',
    status: 'running',
    size: 1024,
    stats: { temp: 35, reads: 12 },
  },
  {
    name: 'disk2',
    status: 'running',
    size: 2048,
    stats: { temp: 33, reads: 50 },
  },
  {
    name: 'flash',
    status: 'running',
    size: 256,
    stats: { temp: 28, reads: 75 },
  },
];

describe('filter parsing', () => {
  it('parses comma separated and repeated filter values', () => {
    expect(parseFilterExpressions(['status=running,size>500'])).toEqual<FilterExpression[]>([
      { field: 'status', operator: '=', value: 'running' },
      { field: 'size', operator: '>', value: '500' },
    ]);
  });

  it('normalizes singular, repeated, and empty filters', () => {
    expect(normalizeFilters('status=running')).toEqual(['status=running']);
    expect(normalizeFilters(['status=running', 'size>100'])).toEqual(['status=running', 'size>100']);
    expect(normalizeFilters(undefined)).toEqual([]);
  });
});

describe('applyFilters', () => {
  it('supports equals filters', () => {
    expect(applyFilters(dataset, 'status=running').map((item) => item.name)).toEqual(['disk1', 'disk2', 'flash']);
  });

  it('supports not-equals filters', () => {
    expect(applyFilters(dataset, 'status!=running').map((item) => item.name)).toEqual(['cache']);
  });

  it('supports contains filters', () => {
    expect(applyFilters(dataset, 'name~disk').map((item) => item.name)).toEqual(['disk1', 'disk2']);
  });

  it('supports greater-than and less-than filters', () => {
    expect(applyFilters(dataset, 'size>500').map((item) => item.name)).toEqual(['cache', 'disk1', 'disk2']);
    expect(applyFilters(dataset, 'stats.temp<33').map((item) => item.name)).toEqual(['cache', 'flash']);
  });

  it('supports nested field access and combined filters', () => {
    expect(applyFilters(dataset, ['status=running', 'stats.reads>40']).map((item) => item.name)).toEqual(['disk2', 'flash']);
  });
});

describe('sort parsing and application', () => {
  it('parses multi-field sort expressions', () => {
    expect(parseSortExpressions('status:asc,size:desc')).toEqual([
      { field: 'status', direction: 'asc' },
      { field: 'size', direction: 'desc' },
    ]);
  });

  it('sorts by multiple fields with asc and desc directions', () => {
    const sorted = applySort(dataset, 'status:asc,size:desc');
    expect(sorted.map((item) => item.name)).toEqual(['disk2', 'disk1', 'flash', 'cache']);
  });

  it('supports sorting by nested number fields', () => {
    const sorted = applySort(dataset, 'stats.temp:desc');
    expect(sorted.map((item) => item.name)).toEqual(['disk1', 'disk2', 'cache', 'flash']);
  });
});

describe('pagination', () => {
  it('uses a default page size of 25', () => {
    expect(resolvePagination({})).toEqual({ all: false, page: 1, pageSize: 25, offset: 0 });
  });

  it('paginates with page and page-size', () => {
    expect(paginate(dataset, { page: 2, pageSize: 2 }).items.map((item) => item.name)).toEqual(['disk2', 'flash']);
  });

  it('returns the full dataset when --all is set', () => {
    const result = paginate(dataset, { all: true, page: 3, pageSize: 1 });
    expect(result.items).toEqual(dataset);
    expect(result.pageSize).toBe(dataset.length);
  });
});
