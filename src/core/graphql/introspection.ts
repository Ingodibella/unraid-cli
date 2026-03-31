import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname } from 'path';
import {
  buildClientSchema,
  getIntrospectionQuery,
  parse,
  printSchema,
  type IntrospectionQuery,
} from 'graphql';
import type { UcliGraphQLClient } from './client.js';

export const DEFAULT_INTROSPECTION_QUERY = getIntrospectionQuery({
  descriptions: true,
  directiveIsRepeatable: true,
  schemaDescription: true,
  inputValueDeprecation: true,
});

export interface IntrospectionQueryResult {
  __schema: IntrospectionQuery['__schema'];
}

export interface FetchSchemaOptions {
  query?: string;
}

export interface SaveSchemaSnapshotOptions {
  format?: 'json' | 'sdl';
}

export async function fetchSchemaIntrospection(
  client: UcliGraphQLClient,
  options: FetchSchemaOptions = {},
): Promise<IntrospectionQueryResult> {
  const result = await client.execute<IntrospectionQueryResult>(
    options.query ?? DEFAULT_INTROSPECTION_QUERY,
  );

  return result;
}

export async function saveSchemaSnapshot(
  snapshot: IntrospectionQueryResult,
  filePath: string,
  options: SaveSchemaSnapshotOptions = {},
): Promise<void> {
  const format = options.format ?? inferSnapshotFormat(filePath);
  const content = format === 'sdl' ? serializeSchemaSnapshotAsSdl(snapshot) : serializeSchemaSnapshot(snapshot);

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf8');
}

export async function loadSchemaSnapshot(filePath: string): Promise<IntrospectionQueryResult> {
  const content = await readFile(filePath, 'utf8');
  const format = inferSnapshotFormat(filePath);

  return format === 'sdl' ? parseSchemaSnapshotFromSdl(content) : parseSchemaSnapshot(content);
}

export function serializeSchemaSnapshot(snapshot: IntrospectionQueryResult): string {
  return `${JSON.stringify(snapshot, null, 2)}\n`;
}

export function parseSchemaSnapshot(content: string): IntrospectionQueryResult {
  return validateIntrospectionResult(JSON.parse(content) as unknown);
}

export function serializeSchemaSnapshotAsSdl(snapshot: IntrospectionQueryResult): string {
  const schema = buildClientSchema(snapshot as IntrospectionQuery);
  return `${printSchema(schema)}\n`;
}

export function parseSchemaSnapshotFromSdl(content: string): IntrospectionQueryResult {
  const document = parse(content);

  return {
    __schema: {
      description: undefined,
      queryType: { kind: 'OBJECT', name: inferRootTypeName(document, 'Query') },
      mutationType: inferOptionalRootType(document, 'Mutation'),
      subscriptionType: inferOptionalRootType(document, 'Subscription'),
      types: [],
      directives: [],
    },
  };
}

function inferSnapshotFormat(filePath: string): 'json' | 'sdl' {
  const normalizedPath = filePath.toLowerCase();
  return normalizedPath.endsWith('.graphql') || normalizedPath.endsWith('.gql') || normalizedPath.endsWith('.sdl')
    ? 'sdl'
    : 'json';
}

function validateIntrospectionResult(value: unknown): IntrospectionQueryResult {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('__schema' in value) ||
    typeof value.__schema !== 'object' ||
    value.__schema === null ||
    !Array.isArray((value.__schema as { types?: unknown }).types)
  ) {
    throw new TypeError('Invalid schema snapshot: expected GraphQL introspection result');
  }

  return value as IntrospectionQueryResult;
}

function inferRootTypeName(document: ReturnType<typeof parse>, fallbackName: string): string {
  const schemaDefinition = document.definitions.find(
    (definition) => definition.kind === 'SchemaDefinition',
  );

  if (schemaDefinition?.kind === 'SchemaDefinition') {
    const operation = schemaDefinition.operationTypes.find((entry) => entry.operation === 'query');
    if (operation) {
      return operation.type.name.value;
    }
  }

  return fallbackName;
}

function inferOptionalRootType(
  document: ReturnType<typeof parse>,
  defaultName: string,
): { kind: 'OBJECT'; name: string } | null {
  const schemaDefinition = document.definitions.find(
    (definition) => definition.kind === 'SchemaDefinition',
  );

  if (schemaDefinition?.kind === 'SchemaDefinition') {
    const operationName = defaultName.toLowerCase() as 'mutation' | 'subscription';
    const operation = schemaDefinition.operationTypes.find((entry) => entry.operation === operationName);
    return operation ? { kind: 'OBJECT', name: operation.type.name.value } : null;
  }

  const hasTypeDefinition = document.definitions.some(
    (definition) => definition.kind === 'ObjectTypeDefinition' && definition.name.value === defaultName,
  );

  return hasTypeDefinition ? { kind: 'OBJECT', name: defaultName } : null;
}
