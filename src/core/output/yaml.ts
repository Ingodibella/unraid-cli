import YAML from 'yaml';

export interface YamlRenderOptions {
  quiet?: boolean;
}

export function renderYaml(data: unknown, _options: YamlRenderOptions = {}): string {
  return YAML.stringify(data, {
    sortMapEntries: true,
  });
}
