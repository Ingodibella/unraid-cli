import Table from 'cli-table3';

export interface TableRenderOptions {
  quiet?: boolean;
  noColor?: boolean;
}

export function renderTable(data: unknown, _options: TableRenderOptions = {}): string {
  if (Array.isArray(data)) {
    return renderTableFromArray(data);
  }

  if (isPlainObject(data)) {
    return renderTableFromObject(data);
  }

  return `${String(data)}\n`;
}

function renderTableFromArray(rows: unknown[]): string {
  if (rows.length === 0) {
    return '\n';
  }

  const normalizedRows = rows.map((row) => (isPlainObject(row) ? row : { value: row }));
  const headers = Array.from(
    normalizedRows.reduce<Set<string>>((allHeaders, row) => {
      Object.keys(row).forEach((key) => allHeaders.add(key));
      return allHeaders;
    }, new Set<string>()),
  );

  const table = new Table({ head: headers });
  for (const row of normalizedRows) {
    table.push(headers.map((header) => formatCell(row[header])));
  }

  return `${table.toString()}\n`;
}

function renderTableFromObject(data: Record<string, unknown>): string {
  const table = new Table({ head: ['field', 'value'] });

  for (const [key, value] of Object.entries(data)) {
    table.push([key, formatCell(value)]);
  }

  return `${table.toString()}\n`;
}

function formatCell(value: unknown): string {
  if (Array.isArray(value) || isPlainObject(value)) {
    return JSON.stringify(value);
  }

  if (value == null) {
    return '';
  }

  return String(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
