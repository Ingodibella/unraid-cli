// C0/C1 control characters (except \n, \r, \t which are safe)
const CONTROL_CHARACTERS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

// OSC sequences (Operating System Command): ESC ] ... BEL or ESC ] ... ESC \
// Used for terminal title changes, clipboard injection, etc.
const OSC_SEQUENCE_REGEX = /\x1B\][^\x07]*(?:\x07|\x1B\\)/g;

// CSI sequences (Select Graphic Rendition, cursor control, etc): ESC [ ... letter
// Includes colors, cursor positioning, screen clear, etc.
const CSI_SEQUENCE_REGEX = /\x1B\[[0-?]*[ -/]*[@-~]/g;

// C1 control characters in UTF-8 form (0xC2 0x80 to 0xC2 0x9F)
const C1_UTF_8_REGEX = /\xC2[\x80-\x9F]/g;

export function sanitizeTerminalText(value: string): string {
  return value
    // Strip OSC sequences (clipboard injection, title changes)
    .replace(OSC_SEQUENCE_REGEX, '')
    // Strip CSI sequences (colors, cursor, screen clear, etc.)
    .replace(CSI_SEQUENCE_REGEX, '')
    // Strip C1 control characters in UTF-8 encoded form
    .replace(C1_UTF_8_REGEX, '')
    // Strip remaining C0 control characters
    .replace(CONTROL_CHARACTERS_REGEX, '');
}
