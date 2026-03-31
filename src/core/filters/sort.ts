export type SortDirection = 'asc' | 'desc';

export interface SortExpression {
  field: string;
  direction: SortDirection;
}

export function parseSortExpressions(sort?: string): SortExpression[] {
  if (sort == null || sort.trim().length === 0) {
    return [];
  }

  return sort
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map(parseSortExpression);
}

export function applySort<T>(items: readonly T[], sort?: string): T[] {
  const expressions = parseSortExpressions(sort);
  if (expressions.length === 0) {
    return [...items];
  }

  return [...items].sort((left, right) => compareByExpressions(left, right, expressions));
}

function parseSortExpression(expression: string): SortExpression {
  const [rawField, rawDirection = 'asc'] = expression.split(':', 2);
  const field = rawField?.trim() ?? '';
  const direction = rawDirection.trim().toLowerCase();

  if (field.length === 0) {
    throw new Error(`Invalid sort expression: ${expression}`);
  }

  if (direction !== 'asc' && direction !== 'desc') {
    throw new Error(`Invalid sort direction: ${expression}`);
  }

  return { field, direction };
}

function compareByExpressions<T>(left: T, right: T, expressions: readonly SortExpression[]): number {
  for (const expression of expressions) {
    const leftValue = getNestedValue(left, expression.field);
    const rightValue = getNestedValue(right, expression.field);
    const comparison = compareValues(leftValue, rightValue);

    if (comparison !== 0) {
      return expression.direction === 'asc' ? comparison : comparison * -1;
    }
  }

  return 0;
}

function compareValues(left: unknown, right: unknown): number {
  if (left === right) {
    return 0;
  }

  if (left == null) {
    return -1;
  }

  if (right == null) {
    return 1;
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return String(left).localeCompare(String(right));
}

function getNestedValue(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, value);
}
