import { readFile } from 'fs/promises';
import type { Command } from 'commander';
import { DEFAULTS, OUTPUT_FORMATS, resolveGlobalOptions, type GlobalOptions } from '../../cli/globals.js';
import { resolveAuth } from '../../core/auth/resolver.js';
import { resolveConfig } from '../../core/config/loader.js';
import { NotFoundError } from '../../core/errors/index.js';
import { createClient } from '../../core/graphql/client.js';
import {
  fetchSchemaIntrospection,
  loadSchemaSnapshot,
  saveSchemaSnapshot,
  serializeSchemaSnapshotAsSdl,
  type IntrospectionQueryResult,
} from '../../core/graphql/introspection.js';
import { renderOutput } from '../../core/output/renderer.js';
import { detectCapabilities } from '../../core/capabilities/detector.js';
import { extractSchemaVersion } from '../../core/capabilities/schema-version.js';
import type {
  IntrospectionInterfaceType,
  IntrospectionObjectType,
  IntrospectionType,
  IntrospectionTypeRef,
} from 'graphql';

export interface SchemaCommandDependencies {
  createGraphQLClient: typeof createClient;
  stdoutWrite: (chunk: string) => boolean;
  readFile: typeof readFile;
}

export const defaultSchemaCommandDependencies: SchemaCommandDependencies = {
  createGraphQLClient: createClient,
  stdoutWrite: (chunk: string) => process.stdout.write(chunk),
  readFile,
};

export interface SchemaTypeRecord {
  name: string;
  kind: string;
  description: string | null;
  fields: Array<{ name: string; type: string }>;
}

export interface SchemaFieldTree {
  name: string;
  type: string;
  children: SchemaFieldTree[];
}

export interface SchemaDiffRecord {
  type: string;
  addedFields: string[];
  removedFields: string[];
  changedFields: Array<{ name: string; before: string; after: string }>;
}

export function applySchemaCommandOptions(command: Command): Command {
  return command
    .option('--host <url>', 'Unraid server URL')
    .option('--api-key <key>', 'API key for authentication')
    .option('--profile <name>', 'Configuration profile to use')
    .option('-o, --output <format>', `Output format (${OUTPUT_FORMATS.join(', ')})`, DEFAULTS.output)
    .option('--fields <fields>', 'Comma-separated list of fields to include')
    .option('--timeout <seconds>', 'Request timeout in seconds', Number.parseInt, DEFAULTS.timeout)
    .option('--debug', 'Enable debug output on stderr')
    .option('-v, --verbose', 'Enable verbose output')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('--no-color', 'Disable colored output');
}

export function resolveSchemaOptions(command: Command): GlobalOptions {
  const parentOptions = command.parent?.optsWithGlobals() ?? {};
  const localOptions = command.opts();
  return resolveGlobalOptions({ ...parentOptions, ...localOptions });
}

export async function fetchSchema(
  options: GlobalOptions,
  dependencies: SchemaCommandDependencies = defaultSchemaCommandDependencies,
): Promise<IntrospectionQueryResult> {
  const resolvedConfig = resolveConfig(options);
  const auth = resolveAuth({
    host: options.host ?? resolvedConfig.host,
    apiKey: options.apiKey ?? resolvedConfig.apiKey,
    profile: options.profile ?? resolvedConfig.profile,
  });

  const client = dependencies.createGraphQLClient({
    endpoint: toGraphQLEndpoint(auth.host),
    apiKey: auth.apiKey,
    timeout: options.timeout * 1000,
    debug: options.debug,
  });

  return fetchSchemaIntrospection(client);
}

export function writeRenderedOutput(
  data: unknown,
  options: GlobalOptions,
  dependencies: SchemaCommandDependencies = defaultSchemaCommandDependencies,
): void {
  dependencies.stdoutWrite(
    renderOutput(data, {
      format: options.output,
      fields: options.fields,
      noColor: options.noColor,
      quiet: options.quiet,
      verbose: options.verbose,
      stdoutIsTTY: process.stdout.isTTY,
    }),
  );
}

export function getTypeByName(snapshot: IntrospectionQueryResult, name: string): IntrospectionType {
  const entry = snapshot.__schema.types.find((type) => type.name === name);
  if (!entry) {
    throw new NotFoundError(`Schema type not found: ${name}`);
  }

  return entry;
}

export function toSchemaTypeRecord(snapshot: IntrospectionQueryResult, typeName: string): SchemaTypeRecord {
  const entry = getTypeByName(snapshot, typeName);

  if (entry.kind === 'OBJECT' || entry.kind === 'INTERFACE') {
    return {
      name: entry.name,
      kind: entry.kind,
      description: entry.description ?? null,
      fields: entry.fields.map((field) => ({ name: field.name, type: formatTypeRef(field.type) })),
    };
  }

  if (entry.kind === 'INPUT_OBJECT') {
    return {
      name: entry.name,
      kind: entry.kind,
      description: entry.description ?? null,
      fields: (entry.inputFields ?? []).map((field) => ({ name: field.name, type: formatTypeRef(field.type) })),
    };
  }

  return {
    name: entry.name,
    kind: entry.kind,
    description: entry.description ?? null,
    fields: [],
  };
}

export function buildSchemaFieldTree(
  snapshot: IntrospectionQueryResult,
  queryName: string,
  depth: number,
): SchemaFieldTree {
  const queryRootName = snapshot.__schema.queryType?.name;
  const queryRoot = findObjectType(snapshot, queryRootName);

  if (!queryRoot) {
    throw new NotFoundError('Query root type is missing in schema');
  }

  const field = queryRoot.fields.find((item) => item.name === queryName);
  if (!field) {
    throw new NotFoundError(`Query field not found: ${queryName}`);
  }

  return {
    name: field.name,
    type: formatTypeRef(field.type),
    children: buildChildren(snapshot, field.type, Math.max(0, depth), new Set([queryRoot.name])),
  };
}

export function buildSchemaDiff(base: IntrospectionQueryResult, live: IntrospectionQueryResult): {
  addedTypes: string[];
  removedTypes: string[];
  changedTypes: SchemaDiffRecord[];
  hasChanges: boolean;
} {
  const baseTypes = new Map(base.__schema.types.map((type) => [type.name, type]));
  const liveTypes = new Map(live.__schema.types.map((type) => [type.name, type]));

  const addedTypes = [...liveTypes.keys()].filter((name) => !baseTypes.has(name)).sort();
  const removedTypes = [...baseTypes.keys()].filter((name) => !liveTypes.has(name)).sort();

  const changedTypes: SchemaDiffRecord[] = [];

  for (const [name, liveType] of liveTypes.entries()) {
    const baseType = baseTypes.get(name);
    if (!baseType) {
      continue;
    }

    const baseFields = collectTypeFields(baseType);
    const liveFields = collectTypeFields(liveType);

    const addedFields = [...liveFields.keys()].filter((fieldName) => !baseFields.has(fieldName)).sort();
    const removedFields = [...baseFields.keys()].filter((fieldName) => !liveFields.has(fieldName)).sort();

    const changedFields = [...liveFields.keys()]
      .filter((fieldName) => baseFields.has(fieldName) && baseFields.get(fieldName) !== liveFields.get(fieldName))
      .sort((left, right) => left.localeCompare(right))
      .map((fieldName) => ({
        name: fieldName,
        before: baseFields.get(fieldName) ?? 'unknown',
        after: liveFields.get(fieldName) ?? 'unknown',
      }));

    if (addedFields.length > 0 || removedFields.length > 0 || changedFields.length > 0) {
      changedTypes.push({ type: name, addedFields, removedFields, changedFields });
    }
  }

  changedTypes.sort((left, right) => left.type.localeCompare(right.type));

  return {
    addedTypes,
    removedTypes,
    changedTypes,
    hasChanges: addedTypes.length > 0 || removedTypes.length > 0 || changedTypes.length > 0,
  };
}

export async function exportSchema(
  snapshot: IntrospectionQueryResult,
  filePath: string | undefined,
  format: 'json' | 'sdl',
): Promise<{ format: 'json' | 'sdl'; filePath?: string; schema?: unknown }> {
  if (filePath) {
    await saveSchemaSnapshot(snapshot, filePath, { format });
    return { format, filePath };
  }

  if (format === 'sdl') {
    return { format, schema: serializeSchemaSnapshotAsSdl(snapshot) };
  }

  return { format, schema: snapshot };
}

export async function readSnapshot(path: string): Promise<IntrospectionQueryResult> {
  return loadSchemaSnapshot(path);
}

export function schemaInfo(snapshot: IntrospectionQueryResult): {
  version: string | null;
  queryCount: number;
  mutationCount: number;
  typeCount: number;
} {
  const capabilities = detectCapabilities(snapshot);

  return {
    version: extractSchemaVersion(snapshot),
    queryCount: capabilities.availableQueries.length,
    mutationCount: capabilities.availableMutations.length,
    typeCount: snapshot.__schema.types.length,
  };
}

export function listQueries(snapshot: IntrospectionQueryResult): string[] {
  return detectCapabilities(snapshot).availableQueries;
}

export function listMutations(snapshot: IntrospectionQueryResult): string[] {
  return detectCapabilities(snapshot).availableMutations;
}

export function validateKnownOperations(snapshot: IntrospectionQueryResult): {
  supported: boolean;
  availableQueries: string[];
  availableMutations: string[];
  missingQueries: string[];
  missingMutations: string[];
} {
  const knownQueries = ['system', 'array', 'disks', 'containers', 'notifications', 'vms', 'shares'];
  const knownMutations = ['array', 'parityCheck', 'containers', 'notifications', 'vms', 'disks'];

  const result = detectCapabilities(snapshot, {
    expected: {
      queries: knownQueries,
      mutations: knownMutations,
    },
  });

  return {
    supported: result.supported,
    availableQueries: result.availableQueries,
    availableMutations: result.availableMutations,
    missingQueries: result.missingQueries,
    missingMutations: result.missingMutations,
  };
}

function toGraphQLEndpoint(host: string): string {
  return host.endsWith('/graphql') ? host : `${host.replace(/\/$/, '')}/graphql`;
}

function findObjectType(
  snapshot: IntrospectionQueryResult,
  typeName: string | null | undefined,
): IntrospectionObjectType | IntrospectionInterfaceType | undefined {
  if (!typeName) {
    return undefined;
  }

  return snapshot.__schema.types.find(
    (type): type is IntrospectionObjectType | IntrospectionInterfaceType =>
      (type.kind === 'OBJECT' || type.kind === 'INTERFACE') && type.name === typeName,
  );
}

function buildChildren(
  snapshot: IntrospectionQueryResult,
  typeRef: IntrospectionTypeRef,
  depth: number,
  visited: Set<string>,
): SchemaFieldTree[] {
  if (depth < 0) {
    return [];
  }

  const namedType = unwrapNamedType(typeRef);
  if (!namedType || visited.has(namedType)) {
    return [];
  }

  const entry = findObjectType(snapshot, namedType);
  if (!entry) {
    return [];
  }

  const nextVisited = new Set(visited);
  nextVisited.add(namedType);

  return entry.fields.map((field) => ({
    name: field.name,
    type: formatTypeRef(field.type),
    children: buildChildren(snapshot, field.type, depth - 1, nextVisited),
  }));
}

function collectTypeFields(type: IntrospectionType): Map<string, string> {
  if (type.kind === 'OBJECT' || type.kind === 'INTERFACE') {
    return new Map(type.fields.map((field) => [field.name, formatTypeRef(field.type)]));
  }

  if (type.kind === 'INPUT_OBJECT') {
    return new Map((type.inputFields ?? []).map((field) => [field.name, formatTypeRef(field.type)]));
  }

  return new Map();
}

export function formatTypeRef(typeRef: IntrospectionTypeRef): string {
  if (typeRef.kind === 'NON_NULL') {
    return `${formatTypeRef(typeRef.ofType)}!`;
  }

  if (typeRef.kind === 'LIST') {
    return `[${formatTypeRef(typeRef.ofType)}]`;
  }

  return typeRef.name ?? 'unknown';
}

function unwrapNamedType(typeRef: IntrospectionTypeRef): string | null {
  if (typeRef.kind === 'NON_NULL' || typeRef.kind === 'LIST') {
    return unwrapNamedType(typeRef.ofType);
  }

  return typeRef.name ?? null;
}
