import type { IntrospectionObjectType, IntrospectionSchema, IntrospectionType } from 'graphql';
import type { IntrospectionQueryResult } from '../graphql/introspection.js';

const VERSION_FIELD_NAMES = ['apiVersion', 'version', 'serverVersion'] as const;
const VERSION_TYPE_NAMES = ['Info', 'ServerInfo', 'SystemInfo'] as const;

export function extractSchemaVersion(schema: IntrospectionQueryResult): string | null {
  return (
    findVersionInSchemaDescription(schema.__schema) ??
    findVersionOnNamedTypes(schema.__schema.types)
  );
}

function findVersionInSchemaDescription(schema: IntrospectionSchema): string | null {
  return extractVersionString(schema.description);
}

function findVersionOnNamedTypes(types: readonly IntrospectionType[]): string | null {
  for (const typeName of VERSION_TYPE_NAMES) {
    const type = types.find(
      (entry): entry is IntrospectionObjectType => entry.kind === 'OBJECT' && entry.name === typeName,
    );
    const fromDescription = extractVersionString(type?.description);
    if (fromDescription) {
      return fromDescription;
    }

    if (type) {
      for (const field of type.fields) {
        const fieldVersion = extractVersionString(field.description);
        if (fieldVersion) {
          return fieldVersion;
        }

        if (VERSION_FIELD_NAMES.includes(field.name as (typeof VERSION_FIELD_NAMES)[number])) {
          const namedType = unwrapNamedType(field.type);
          if (namedType) {
            return namedType;
          }
        }
      }
    }
  }

  return null;
}

function extractVersionString(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const match = value.match(/v?(\d+\.\d+(?:\.\d+)?(?:[-+][A-Za-z0-9.]+)?)/);
  return match ? match[1] : null;
}

function unwrapNamedType(type: {
  kind: string;
  name?: string | null;
  ofType?: { kind: string; name?: string | null; ofType?: unknown } | null;
}): string | null {
  if (type.name) {
    return type.name;
  }

  if (type.ofType && typeof type.ofType === 'object') {
    return unwrapNamedType(type.ofType as {
      kind: string;
      name?: string | null;
      ofType?: { kind: string; name?: string | null; ofType?: unknown } | null;
    });
  }

  return null;
}
