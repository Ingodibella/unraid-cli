/**
 * Tests for src/core/graphql/client.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClient, GraphQLResponseError } from '../../../src/core/graphql/client.js';

// We mock the GraphQLClient from graphql-request to avoid real HTTP calls
vi.mock('graphql-request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('graphql-request')>();
  return {
    ...actual,
    GraphQLClient: vi.fn(),
  };
});

import { GraphQLClient } from 'graphql-request';

const MockedGraphQLClient = vi.mocked(GraphQLClient);

function makeMockRawRequest(response: { data?: unknown; errors?: unknown[] }) {
  return vi.fn().mockResolvedValue(response);
}

function makeClientMock(rawRequest: ReturnType<typeof makeMockRawRequest>) {
  MockedGraphQLClient.mockImplementation(
    () => ({ rawRequest } as unknown as InstanceType<typeof GraphQLClient>)
  );
}

describe('createClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a client with required options', () => {
    makeClientMock(makeMockRawRequest({ data: {} }));

    const client = createClient({
      endpoint: 'http://unraid.local:7777/graphql',
      apiKey: 'test-api-key',
    });

    expect(client).toBeDefined();
    expect(typeof client.execute).toBe('function');
  });

  it('exposes a requestId', () => {
    makeClientMock(makeMockRawRequest({ data: {} }));

    const client = createClient({
      endpoint: 'http://unraid.local:7777/graphql',
      apiKey: 'test-api-key',
    });

    expect(typeof client.requestId).toBe('string');
    expect(client.requestId.length).toBeGreaterThan(0);
  });

  it('uses a provided requestId', () => {
    makeClientMock(makeMockRawRequest({ data: {} }));

    const client = createClient({
      endpoint: 'http://unraid.local:7777/graphql',
      apiKey: 'test-api-key',
      requestId: 'my-fixed-id',
    });

    expect(client.requestId).toBe('my-fixed-id');
  });

  it('generates a unique requestId each time when not provided', () => {
    makeClientMock(makeMockRawRequest({ data: {} }));

    const a = createClient({ endpoint: 'http://x/graphql', apiKey: 'k' });
    const b = createClient({ endpoint: 'http://x/graphql', apiKey: 'k' });

    expect(a.requestId).not.toBe(b.requestId);
  });

  it('injects x-api-key header into GraphQLClient constructor', () => {
    makeClientMock(makeMockRawRequest({ data: {} }));

    createClient({
      endpoint: 'http://unraid.local:7777/graphql',
      apiKey: 'secret-key-123',
    });

    expect(MockedGraphQLClient).toHaveBeenCalledOnce();
    const [, constructorOptions] = MockedGraphQLClient.mock.calls[0];
    expect((constructorOptions as { headers: Record<string, string> }).headers['x-api-key']).toBe(
      'secret-key-123'
    );
  });

  it('injects x-request-id header matching requestId', () => {
    makeClientMock(makeMockRawRequest({ data: {} }));

    createClient({
      endpoint: 'http://unraid.local:7777/graphql',
      apiKey: 'k',
      requestId: 'req-abc',
    });

    const [, constructorOptions] = MockedGraphQLClient.mock.calls[0];
    expect(
      (constructorOptions as { headers: Record<string, string> }).headers['x-request-id']
    ).toBe('req-abc');
  });

  it('passes the correct endpoint to GraphQLClient', () => {
    makeClientMock(makeMockRawRequest({ data: {} }));

    createClient({
      endpoint: 'http://unraid.example.com:7777/graphql',
      apiKey: 'k',
    });

    const [endpoint] = MockedGraphQLClient.mock.calls[0];
    expect(endpoint).toBe('http://unraid.example.com:7777/graphql');
  });

  it('injects a custom fetch with timeout support', () => {
    makeClientMock(makeMockRawRequest({ data: {} }));

    createClient({
      endpoint: 'http://x/graphql',
      apiKey: 'k',
      timeout: 5000,
    });

    const [, constructorOptions] = MockedGraphQLClient.mock.calls[0];
    expect(typeof (constructorOptions as { fetch?: unknown }).fetch).toBe('function');
  });
});

describe('createClient - execute()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns typed data from the GraphQL response', async () => {
    const rawRequest = makeMockRawRequest({ data: { system: { uptime: 42 } } });
    makeClientMock(rawRequest);

    const client = createClient({ endpoint: 'http://x/graphql', apiKey: 'k' });
    const result = await client.execute<{ system: { uptime: number } }>('{ system { uptime } }');

    expect(result).toEqual({ system: { uptime: 42 } });
  });

  it('forwards variables to rawRequest', async () => {
    const rawRequest = makeMockRawRequest({ data: {} });
    makeClientMock(rawRequest);

    const client = createClient({ endpoint: 'http://x/graphql', apiKey: 'k' });
    await client.execute('query Q($id: ID!) { node(id: $id) { id } }', { id: '123' });

    expect(rawRequest).toHaveBeenCalledWith(
      'query Q($id: ID!) { node(id: $id) { id } }',
      { id: '123' }
    );
  });

  it('calls rawRequest without variables when none provided', async () => {
    const rawRequest = makeMockRawRequest({ data: { ping: true } });
    makeClientMock(rawRequest);

    const client = createClient({ endpoint: 'http://x/graphql', apiKey: 'k' });
    await client.execute('{ ping }');

    expect(rawRequest).toHaveBeenCalledWith('{ ping }', undefined);
  });
});

describe('createClient - GraphQL error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws GraphQLResponseError when response contains errors', async () => {
    const clientError = Object.assign(new Error('GraphQL error'), {
      response: {
        errors: [{ message: 'Field not found', path: ['query', 'missing'] }],
        status: 200,
      },
      request: {},
    });

    const rawRequest = vi.fn().mockRejectedValue(clientError);
    makeClientMock(rawRequest);

    const client = createClient({ endpoint: 'http://x/graphql', apiKey: 'k' });

    await expect(client.execute('{ missing }')).rejects.toThrow(GraphQLResponseError);
  });

  it('GraphQLResponseError contains the error messages', async () => {
    const clientError = Object.assign(new Error('GraphQL error'), {
      response: {
        errors: [
          { message: 'First error' },
          { message: 'Second error' },
        ],
        status: 200,
      },
      request: {},
    });

    const rawRequest = vi.fn().mockRejectedValue(clientError);
    makeClientMock(rawRequest);

    const client = createClient({ endpoint: 'http://x/graphql', apiKey: 'k' });

    let caught: GraphQLResponseError | undefined;
    try {
      await client.execute('{ q }');
    } catch (e) {
      caught = e as GraphQLResponseError;
    }

    expect(caught).toBeInstanceOf(GraphQLResponseError);
    expect(caught?.errors).toHaveLength(2);
    expect(caught?.errors[0].message).toBe('First error');
    expect(caught?.errors[1].message).toBe('Second error');
    expect(caught?.message).toContain('First error');
    expect(caught?.message).toContain('Second error');
  });

  it('GraphQLResponseError has exitCode 8', async () => {
    const clientError = Object.assign(new Error('GraphQL error'), {
      response: {
        errors: [{ message: 'Some error' }],
        status: 200,
      },
      request: {},
    });

    const rawRequest = vi.fn().mockRejectedValue(clientError);
    makeClientMock(rawRequest);

    const client = createClient({ endpoint: 'http://x/graphql', apiKey: 'k' });

    let caught: GraphQLResponseError | undefined;
    try {
      await client.execute('{ q }');
    } catch (e) {
      caught = e as GraphQLResponseError;
    }

    expect(caught?.exitCode).toBe(8);
  });

  it('GraphQLResponseError includes the requestId', async () => {
    const clientError = Object.assign(new Error('GraphQL error'), {
      response: {
        errors: [{ message: 'err' }],
        status: 200,
      },
      request: {},
    });

    const rawRequest = vi.fn().mockRejectedValue(clientError);
    makeClientMock(rawRequest);

    const client = createClient({
      endpoint: 'http://x/graphql',
      apiKey: 'k',
      requestId: 'trace-xyz',
    });

    let caught: GraphQLResponseError | undefined;
    try {
      await client.execute('{ q }');
    } catch (e) {
      caught = e as GraphQLResponseError;
    }

    expect(caught?.requestId).toBe('trace-xyz');
  });

  it('re-throws non-GraphQL errors as-is', async () => {
    const networkError = new Error('ECONNREFUSED');
    const rawRequest = vi.fn().mockRejectedValue(networkError);
    makeClientMock(rawRequest);

    const client = createClient({ endpoint: 'http://x/graphql', apiKey: 'k' });

    await expect(client.execute('{ q }')).rejects.toThrow('ECONNREFUSED');
  });
});

describe('createClient - debug mode', () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  it('does not write to stderr when debug is false', async () => {
    const rawRequest = makeMockRawRequest({ data: { x: 1 } });
    makeClientMock(rawRequest);

    const client = createClient({
      endpoint: 'http://x/graphql',
      apiKey: 'k',
      debug: false,
    });

    await client.execute('{ x }');

    expect(stderrSpy).not.toHaveBeenCalled();
  });

  it('writes request info to stderr when debug is true', async () => {
    const rawRequest = makeMockRawRequest({ data: { x: 1 } });
    makeClientMock(rawRequest);

    const client = createClient({
      endpoint: 'http://x/graphql',
      apiKey: 'k',
      debug: true,
      requestId: 'dbg-001',
    });

    await client.execute('{ x }');

    const allOutput = stderrSpy.mock.calls.map((c) => c[0]).join('');
    expect(allOutput).toContain('dbg-001');
    expect(allOutput).toContain('http://x/graphql');
  });

  it('writes response info to stderr when debug is true', async () => {
    const rawRequest = makeMockRawRequest({ data: { result: 'ok' } });
    makeClientMock(rawRequest);

    const client = createClient({
      endpoint: 'http://x/graphql',
      apiKey: 'k',
      debug: true,
    });

    await client.execute('{ result }');

    const allOutput = stderrSpy.mock.calls.map((c) => c[0]).join('');
    expect(allOutput).toContain('result');
  });

  it('writes error info to stderr when debug is true and GraphQL error occurs', async () => {
    const clientError = Object.assign(new Error('GraphQL error'), {
      response: { errors: [{ message: 'boom' }], status: 200 },
      request: {},
    });
    const rawRequest = vi.fn().mockRejectedValue(clientError);
    makeClientMock(rawRequest);

    const client = createClient({
      endpoint: 'http://x/graphql',
      apiKey: 'k',
      debug: true,
      requestId: 'dbg-err',
    });

    await expect(client.execute('{ q }')).rejects.toThrow(GraphQLResponseError);

    const allOutput = stderrSpy.mock.calls.map((c) => c[0]).join('');
    expect(allOutput).toContain('dbg-err');
  });
});

describe('GraphQLResponseError', () => {
  it('is an instance of Error', () => {
    const err = new GraphQLResponseError([{ message: 'test' }], 'req-1');
    expect(err).toBeInstanceOf(Error);
  });

  it('has correct name', () => {
    const err = new GraphQLResponseError([{ message: 'test' }], 'req-1');
    expect(err.name).toBe('GraphQLResponseError');
  });

  it('includes all error messages in the main message', () => {
    const err = new GraphQLResponseError(
      [{ message: 'one' }, { message: 'two' }],
      'req-1'
    );
    expect(err.message).toContain('one');
    expect(err.message).toContain('two');
  });
});
