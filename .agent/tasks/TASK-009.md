# TASK-009: Filter, Sort, and Pagination Engine

## Description
Implement client-side filtering, sorting, and pagination for list commands.

## Acceptance Criteria
- [ ] `src/core/filters/filter.ts` parses --filter expressions (e.g., --filter "status=running")
- [ ] Filter supports operators: = (equals), != (not equals), ~ (contains), > (gt), < (lt)
- [ ] `src/core/filters/sort.ts` parses --sort expressions (e.g., --sort "name:asc,size:desc")
- [ ] `src/core/filters/paging.ts` implements --page, --page-size, --all pagination
- [ ] Default page-size: 25
- [ ] --all disables pagination and returns everything
- [ ] Filters work on the deserialized data objects (client-side filtering)
- [ ] Sort supports ascending and descending for string and number fields

## Affected Files
- `src/core/filters/filter.ts` (new)
- `src/core/filters/sort.ts` (new)
- `src/core/filters/paging.ts` (new)
- `tests/unit/core/filters.test.ts` (new)

## Dependencies
- TASK-007 (Output layer needs filtered data)

## Implementation Notes
- Filter syntax: `field=value`, `field!=value`, `field~substring`, `field>number`, `field<number`
- Multiple filters: comma-separated or repeated --filter flags
- Sort syntax: `field:asc` or `field:desc`, comma-separated for multi-sort
- Paging: slice array by offset/limit based on page and page-size
- Consider nested field access with dot notation: `disks.status=active`

## Validation
- `tests/unit/core/filters.test.ts` covers:
  - Equals filter
  - Not-equals filter
  - Contains filter
  - Greater-than and less-than filters
  - Multi-field sort (asc + desc)
  - Pagination with page and page-size
  - --all returns full dataset
  - Nested field access
