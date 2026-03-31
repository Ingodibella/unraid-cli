import type { IntrospectionObjectType } from 'graphql';
import type { IntrospectionQueryResult } from '../graphql/introspection.js';
import { extractSchemaVersion } from './schema-version.js';

export interface CapabilityDescriptor {
  queries?: string[];
  mutations?: string[];
}

export interface CapabilityDetectionResult {
  availableQueries: string[];
  availableMutations: string[];
  missingQueries: string[];
  missingMutations: string[];
  supported: boolean;
  apiVersion?: string;
}

export interface DetectCapabilitiesOptions {
  expected?: CapabilityDescriptor;
}

export function detectCapabilities(
  schema: IntrospectionQueryResult,
  options: DetectCapabilitiesOptions = {},
): CapabilityDetectionResult {
  const availableQueries = listRootOperationFields(schema, schema.__schema.queryType?.name);
  const availableMutations = listRootOperationFields(schema, schema.__schema.mutationType?.name ?? null);
  const expectedQueries = options.expected?.queries ?? [];
  const expectedMutations = options.expected?.mutations ?? [];

  return {
    availableQueries,
    availableMutations,
    missingQueries: expectedQueries.filter((name) => !availableQueries.includes(name)),
    missingMutations: expectedMutations.filter((name) => !availableMutations.includes(name)),
    supported:
      expectedQueries.every((name) => availableQueries.includes(name)) &&
      expectedMutations.every((name) => availableMutations.includes(name)),
    apiVersion: extractSchemaVersion(schema) ?? undefined,
  };
}

function listRootOperationFields(
  schema: IntrospectionQueryResult,
  rootTypeName: string | null | undefined,
): string[] {
  if (!rootTypeName) {
    return [];
  }

  const rootType = schema.__schema.types.find(
    (type): type is IntrospectionObjectType =>
      type.kind === 'OBJECT' && type.name === rootTypeName && Array.isArray(type.fields),
  );

  if (!rootType) {
    return [];
  }

  return rootType.fields.map((field) => field.name).sort((left, right) => left.localeCompare(right));
}
