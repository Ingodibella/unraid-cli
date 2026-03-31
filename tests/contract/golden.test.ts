import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../src/cli/index.js';

type FixtureData = Record<string, unknown>;

function loadFixture(path: string): FixtureData {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8')) as FixtureData;
}

const responseFixture: FixtureData = {
  ...loadFixture('tests/fixtures/system-info.json'),
  ...loadFixture('tests/fixtures/array-response.json'),
  ...loadFixture('tests/fixtures/disks-response.json'),
  ...loadFixture('tests/fixtures/docker-response.json'),
  ...loadFixture('tests/fixtures/vms-response.json'),
  ...loadFixture('tests/fixtures/notifications-response.json'),
  ...loadFixture('tests/fixtures/shares-response.json'),
};

const { executeMock, createClientMock } = vi.hoisted(() => {
  const execute = vi.fn();
  const createClient = vi.fn(() => ({
    execute,
    requestId: 'req-golden-test',
  }));

  return {
    executeMock: execute,
    createClientMock: createClient,
  };
});

vi.mock('../../src/core/graphql/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/core/graphql/client.js')>();
  return {
    ...actual,
    createClient: createClientMock,
  };
});

interface GoldenCase {
  name: string;
  argv: string[];
  baseName: string;
}

const cases: GoldenCase[] = [
  { name: 'system info', argv: ['system', 'info'], baseName: 'system-info' },
  { name: 'array show', argv: ['array', 'show'], baseName: 'array-show' },
  { name: 'disks list', argv: ['disks', 'list'], baseName: 'disks-list' },
  { name: 'containers list', argv: ['containers', 'list'], baseName: 'containers-list' },
  { name: 'vms list', argv: ['vms', 'list'], baseName: 'vms-list' },
  { name: 'notifications list', argv: ['notifications', 'list'], baseName: 'notifications-list' },
  { name: 'shares list', argv: ['shares', 'list'], baseName: 'shares-list' },
];

const goldenDir = resolve(process.cwd(), 'tests/fixtures/golden');
const updateGolden = process.env.UCLI_UPDATE_GOLDEN === '1';

function assertGoldenFile(path: string, actual: string): void {
  if (updateGolden) {
    mkdirSync(goldenDir, { recursive: true });
    writeFileSync(path, actual, 'utf8');
    return;
  }

  const expected = readFileSync(path, 'utf8');
  expect(actual).toBe(expected);
}

describe('contract golden fixtures for read commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeMock.mockResolvedValue(responseFixture);
    process.env.UCLI_HOST = 'http://tower.local:7777';
    process.env.UCLI_API_KEY = 'test-api-key';
  });

  for (const testCase of cases) {
    it(`${testCase.name} matches human golden output`, async () => {
      const program = createProgram();
      let stdout = '';
      const originalWrite = process.stdout.write;
      process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
        stdout += String(chunk);
        return true;
      });

      try {
        await program.parseAsync(['node', 'ucli', ...testCase.argv, '--output', 'human', '--no-color']);
      } finally {
        process.stdout.write = originalWrite;
      }

      assertGoldenFile(resolve(goldenDir, `${testCase.baseName}.human.txt`), stdout);
    });

    it(`${testCase.name} matches json golden output`, async () => {
      const program = createProgram();
      let stdout = '';
      const originalWrite = process.stdout.write;
      process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
        stdout += String(chunk);
        return true;
      });

      try {
        await program.parseAsync(['node', 'ucli', ...testCase.argv, '--output', 'json']);
      } finally {
        process.stdout.write = originalWrite;
      }

      assertGoldenFile(resolve(goldenDir, `${testCase.baseName}.json`), stdout);
    });
  }
});
