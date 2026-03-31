export const DEFAULT_PAGE_SIZE = 25;

export interface PaginationInput {
  page?: number;
  pageSize?: number;
  all?: boolean;
}

export interface PaginationState {
  all: boolean;
  page: number;
  pageSize: number;
  offset: number;
}

export interface PaginationResult<T> extends PaginationState {
  items: T[];
  totalItems: number;
  totalPages: number;
}

export function resolvePagination(input: PaginationInput): PaginationState {
  const all = input.all ?? false;
  const page = normalizePositiveInteger(input.page, 1);
  const pageSize = normalizePositiveInteger(input.pageSize, DEFAULT_PAGE_SIZE);

  return {
    all,
    page,
    pageSize,
    offset: all ? 0 : (page - 1) * pageSize,
  };
}

export function paginate<T>(items: readonly T[], input: PaginationInput): PaginationResult<T> {
  const resolved = resolvePagination(input);

  if (resolved.all) {
    return {
      ...resolved,
      items: [...items],
      page: 1,
      pageSize: items.length,
      totalItems: items.length,
      totalPages: items.length > 0 ? 1 : 0,
    };
  }

  const pagedItems = items.slice(resolved.offset, resolved.offset + resolved.pageSize);
  const totalPages = items.length === 0 ? 0 : Math.ceil(items.length / resolved.pageSize);

  return {
    ...resolved,
    items: pagedItems,
    totalItems: items.length,
    totalPages,
  };
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (value == null || !Number.isInteger(value) || value < 1) {
    return fallback;
  }

  return value;
}
