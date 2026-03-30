import type { OutputFormat } from '../../cli/globals.js';
import { selectFields } from './fields.js';
import { renderHuman } from './human.js';
import { renderJson } from './json.js';
import { renderTable } from './table.js';
import { renderYaml } from './yaml.js';

export interface RenderOptions {
  fields?: string;
  format?: OutputFormat;
  noColor?: boolean;
  quiet?: boolean;
  verbose?: boolean;
  stdoutIsTTY?: boolean;
}

export interface OutputRenderer {
  render(data: unknown, options?: RenderOptions): string;
}

export function resolveOutputFormat(options: Pick<RenderOptions, 'format' | 'stdoutIsTTY'> = {}): OutputFormat {
  if (options.format) {
    return options.format;
  }

  if (options.stdoutIsTTY ?? process.stdout.isTTY) {
    return 'human';
  }

  return 'json';
}

export function renderOutput(data: unknown, options: RenderOptions = {}): string {
  const format = resolveOutputFormat(options);
  const filteredData = selectFields(data, options.fields);

  switch (format) {
    case 'human':
      return renderHuman(filteredData, options);
    case 'json':
      return renderJson(filteredData, options);
    case 'yaml':
      return renderYaml(filteredData, options);
    case 'table':
      return renderTable(filteredData, options);
  }
}

export const defaultOutputRenderer: OutputRenderer = {
  render: renderOutput,
};
