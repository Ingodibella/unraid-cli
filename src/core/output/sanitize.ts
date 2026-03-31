import { stripVTControlCharacters } from 'node:util';

const CONTROL_CHARACTERS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeTerminalText(value: string): string {
  return stripVTControlCharacters(value).replace(CONTROL_CHARACTERS_REGEX, '');
}
