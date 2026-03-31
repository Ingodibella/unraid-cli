import chalk, { Chalk } from 'chalk';

export interface HumanRenderOptions {
  noColor?: boolean;
  quiet?: boolean;
}

export function renderHuman(data: unknown, options: HumanRenderOptions = {}): string {
  const painter = options.noColor ? new Chalk({ level: 0 }) : chalk;

  if (data == null) {
    return options.quiet ? '' : '\n';
  }

  if (Array.isArray(data)) {
    return renderArray(data, painter, options);
  }

  if (isPlainObject(data)) {
    return renderObject(data, painter, options);
  }

  return `${formatPrimitive(data)}\n`;
}

function renderArray(data: unknown[], painter: typeof chalk, options: HumanRenderOptions): string {
  if (data.length === 0) {
    return options.quiet ? '' : '\n';
  }

  if (data.every((item) => isPlainObject(item))) {
    return data
      .map((item, index) => {
        const prefix = options.quiet ? '' : `${painter.dim(`#${index + 1}`)}\n`;
        return `${prefix}${renderObject(item, painter, options).trimEnd()}`;
      })
      .join('\n\n')
      .concat('\n');
  }

  return data.map((item) => formatValue(item, painter)).join('\n').concat('\n');
}

function renderObject(
  data: Record<string, unknown>,
  painter: typeof chalk,
  _options: HumanRenderOptions,
): string {
  return Object.entries(data)
    .map(([key, value]) => `${painter.cyan(key)}: ${formatValue(value, painter)}`)
    .join('\n')
    .concat('\n');
}

function formatValue(value: unknown, painter: typeof chalk): string {
  if (Array.isArray(value)) {
    return value.map((item) => formatValue(item, painter)).join(', ');
  }

  if (isPlainObject(value)) {
    return Object.entries(value)
      .map(([key, nestedValue]) => `${key}=${formatValue(nestedValue, painter)}`)
      .join(', ');
  }

  if (typeof value === 'string') {
    return formatString(value, painter);
  }

  if (typeof value === 'number') {
    return formatNumber(value);
  }

  if (typeof value === 'boolean') {
    return value ? painter.green('yes') : painter.red('no');
  }

  return formatPrimitive(value);
}

function formatString(value: string, painter: typeof chalk): string {
  const sanitizedValue = sanitizeControlCharacters(value);
  const lowered = sanitizedValue.toLowerCase();
  if (['running', 'healthy', 'online', 'ok', 'success'].includes(lowered)) {
    return painter.green(sanitizedValue);
  }

  if (['stopped', 'offline', 'failed', 'error', 'alert', 'critical', 'fatal'].includes(lowered)) {
    return painter.red(sanitizedValue);
  }

  if (['degraded', 'warning', 'pending', 'notice'].includes(lowered)) {
    return painter.yellow(sanitizedValue);
  }

  if (['info'].includes(lowered)) {
    return painter.blue(sanitizedValue);
  }

  return sanitizedValue;
}

function sanitizeControlCharacters(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f-\u009f]/g, (char) => {
    if (char === '\t') {
      return '\\t';
    }
    if (char === '\n') {
      return '\\n';
    }
    if (char === '\r') {
      return '\\r';
    }
    return `\\x${char.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()}`;
  });
}

function formatNumber(value: number): string {
  if (Number.isFinite(value) && value >= 1024 ** 3) {
    const tebibyte = 1024 ** 4;
    if (value >= tebibyte) {
      return `${(value / tebibyte).toFixed(2)} TiB`;
    }
    return `${(value / 1024 ** 3).toFixed(2)} GiB`;
  }

  if (Number.isFinite(value) && value >= 20 && value <= 120 && Number.isInteger(value)) {
    return `${value} C`;
  }

  return String(value);
}

function formatPrimitive(value: unknown): string {
  if (value == null) {
    return '';
  }

  return String(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
