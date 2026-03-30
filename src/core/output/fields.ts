export function parseFields(fields?: string): string[] {
  if (!fields) {
    return [];
  }

  return fields
    .split(',')
    .map((field) => field.trim())
    .filter((field) => field.length > 0);
}

export function selectFields<T>(data: T, fields?: string | string[]): T {
  const parsedFields = Array.isArray(fields) ? fields : parseFields(fields);

  if (parsedFields.length === 0) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => selectFields(item, parsedFields)) as T;
  }

  if (!isPlainObject(data)) {
    return data;
  }

  const result: Record<string, unknown> = {};

  for (const field of parsedFields) {
    const value = getNestedValue(data, field);
    if (value !== undefined) {
      setNestedValue(result, field, value);
    }
  }

  return result as T;
}

function getNestedValue(value: unknown, path: string): unknown {
  const segments = path.split('.');
  let current: unknown = value;

  for (const segment of segments) {
    if (Array.isArray(current)) {
      current = current.map((item) => (isPlainObject(item) ? item[segment] : undefined));
      continue;
    }

    if (!isPlainObject(current) || !(segment in current)) {
      return undefined;
    }

    current = current[segment];
  }

  return current;
}

function setNestedValue(target: Record<string, unknown>, path: string, value: unknown): void {
  const segments = path.split('.');
  let current: Record<string, unknown> = target;

  for (const segment of segments.slice(0, -1)) {
    const existing = current[segment];
    if (!isPlainObject(existing)) {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
  }

  const finalSegment = segments[segments.length - 1];
  current[finalSegment] = value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
