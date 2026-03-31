export type FilterOperator = '=' | '!=' | '~' | '>' | '<';

export interface FilterExpression {
  field: string;
  operator: FilterOperator;
  value: string;
}

const FILTER_OPERATORS: readonly FilterOperator[] = ['!=', '=', '~', '>', '<'] as const;

export function normalizeFilters(filters?: string | string[]): string[] {
  if (filters == null) {
    return [];
  }

  return Array.isArray(filters) ? filters.filter((value) => value.length > 0) : [filters].filter((value) => value.length > 0);
}

export function parseFilterExpressions(filters?: string | string[]): FilterExpression[] {
  return normalizeFilters(filters)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map(parseFilterExpression);
}

export function applyFilters<T>(items: readonly T[], filters?: string | string[]): T[] {
  const expressions = parseFilterExpressions(filters);
  if (expressions.length === 0) {
    return [...items];
  }

  return items.filter((item) => expressions.every((expression) => matchesExpression(item, expression)));
}

function parseFilterExpression(expression: string): FilterExpression {
  for (const operator of FILTER_OPERATORS) {
    const operatorIndex = expression.indexOf(operator);
    if (operatorIndex <= 0) {
      continue;
    }

    const field = expression.slice(0, operatorIndex).trim();
    const value = expression.slice(operatorIndex + operator.length).trim();

    if (field.length === 0 || value.length === 0) {
      break;
    }

    return { field, operator, value };
  }

  throw new Error(`Invalid filter expression: ${expression}`);
}

function matchesExpression<T>(item: T, expression: FilterExpression): boolean {
  const fieldValue = getNestedValue(item, expression.field);

  switch (expression.operator) {
    case '=':
      return compareEquality(fieldValue, expression.value);
    case '!=':
      return !compareEquality(fieldValue, expression.value);
    case '~':
      return String(fieldValue ?? '').includes(expression.value);
    case '>':
      return compareNumeric(fieldValue, expression.value, (left, right) => left > right);
    case '<':
      return compareNumeric(fieldValue, expression.value, (left, right) => left < right);
  }
}

function compareEquality(fieldValue: unknown, expectedValue: string): boolean {
  if (typeof fieldValue === 'number') {
    const parsed = Number(expectedValue);
    return !Number.isNaN(parsed) && fieldValue === parsed;
  }

  if (typeof fieldValue === 'boolean') {
    return String(fieldValue) === expectedValue;
  }

  return String(fieldValue ?? '') === expectedValue;
}

function compareNumeric(
  fieldValue: unknown,
  expectedValue: string,
  comparator: (left: number, right: number) => boolean,
): boolean {
  const left = typeof fieldValue === 'number' ? fieldValue : Number(fieldValue);
  const right = Number(expectedValue);

  if (Number.isNaN(left) || Number.isNaN(right)) {
    return false;
  }

  return comparator(left, right);
}

function getNestedValue(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, value);
}
