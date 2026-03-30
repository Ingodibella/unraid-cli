export interface JsonRenderOptions {
  quiet?: boolean;
}

export function renderJson(data: unknown, _options: JsonRenderOptions = {}): string {
  return `${stableStringify(data, 2)}\n`;
}

function stableStringify(value: unknown, space: number): string {
  return JSON.stringify(sortValue(value), null, space);
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortValue(item));
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  return Object.keys(value)
    .sort((left, right) => left.localeCompare(right))
    .reduce<Record<string, unknown>>((accumulator, key) => {
      accumulator[key] = sortValue((value as Record<string, unknown>)[key]);
      return accumulator;
    }, {});
}
