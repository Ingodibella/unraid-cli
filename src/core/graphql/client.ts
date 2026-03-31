/**
 * GraphQL client factory for ucli.
 *
 * Creates a typed GraphQL client per CLI invocation. Handles:
 * - API key injection via x-api-key header
 * - Configurable timeout (default 30s)
 * - Request ID generation for debug correlation
 * - Debug logging to stderr
 * - Typed GraphQL error detection and re-throw
 */

import { GraphQLClient, gql } from 'graphql-request';
import { randomUUID } from 'crypto';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { DocumentNode } from 'graphql';
import {
  type GraphQLErrorDetail,
  GraphQLResponseError,
  normalizeGraphQLErrors,
} from '../errors/graphql-errors.js';

export { gql, GraphQLResponseError };

/** Options for creating a GraphQL client */
export interface GraphQLClientOptions {
  endpoint: string;
  apiKey: string;
  timeout?: number;
  debug?: boolean;
  requestId?: string;
}

/** Typed ucli GraphQL client */
export interface UcliGraphQLClient {
  execute<TData, TVariables extends object = object>(
    document: DocumentNode | TypedDocumentNode<TData, TVariables> | string,
    variables?: TVariables
  ): Promise<TData>;
  readonly requestId: string;
}

/**
 * Creates a new GraphQL client instance for a single CLI invocation.
 *
 * Not a singleton: create once per invocation and pass down.
 */
export function createClient(options: GraphQLClientOptions): UcliGraphQLClient {
  const {
    endpoint,
    apiKey,
    timeout = 30_000,
    debug = false,
    requestId = randomUUID(),
  } = options;

  const headers: Record<string, string> = {
    'x-api-key': apiKey,
    'x-request-id': requestId,
    'content-type': 'application/json',
  };

  const inner = new GraphQLClient(endpoint, {
    headers,
    // graphql-request v7 uses fetch under the hood; inject timeout via signal
    fetch: (url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      const fetchInit: RequestInit = { ...init, signal: controller.signal };
      return fetch(url, fetchInit).finally(() => clearTimeout(timer));
    },
  });

  async function execute<
    TData,
    TVariables extends object = object,
  >(
    document: DocumentNode | TypedDocumentNode<TData, TVariables> | string,
    variables?: TVariables
  ): Promise<TData> {
    if (debug) {
      const docStr = typeof document === 'string' ? document : JSON.stringify(document);
      process.stderr.write(
        `[ucli:debug] request ${requestId} endpoint=${endpoint} variables=${JSON.stringify(variables ?? {})}\n`
      );
      process.stderr.write(`[ucli:debug] document: ${docStr}\n`);
    }

    try {
      // graphql-request v7: request() returns data directly and throws on errors
      // We use rawRequest to capture errors in the response body
      const result = await inner.rawRequest<TData>(
        document as string,
        variables as Record<string, unknown> | undefined,
      );

      if (debug) {
        process.stderr.write(
          `[ucli:debug] response ${requestId}: ${JSON.stringify(result.data)}\n`
        );
      }

      return result.data;
    } catch (err: unknown) {
      // graphql-request throws ClientError when response contains GraphQL errors
      if (isClientError(err)) {
        if (debug) {
          process.stderr.write(
            `[ucli:debug] graphql error ${requestId}: ${JSON.stringify(err.response?.errors)}\n`
          );
        }
        const errors: GraphQLErrorDetail[] = (err.response?.errors ?? []).map(
          (e: { message: string; locations?: unknown; path?: unknown; extensions?: unknown }) => ({
            message: e.message,
            locations: e.locations as GraphQLErrorDetail['locations'],
            path: e.path as string[],
            extensions: e.extensions as Record<string, unknown>,
          }),
        );
        if (errors.length > 0) {
          throw normalizeGraphQLErrors({ errors, status: err.response?.status }, requestId);
        }
      }
      throw err;
    }
  }

  return { execute, requestId };
}

/** Type guard for graphql-request ClientError */
function isClientError(err: unknown): err is {
  response?: {
    errors?: Array<{ message: string; locations?: unknown; path?: unknown; extensions?: unknown }>;
    status?: number;
  };
  request?: unknown;
} {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    'request' in err
  );
}
