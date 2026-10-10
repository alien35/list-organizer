/**
 * ANSI Color and Formatting Utilities (Zero Dependency)
 */

const isColorSupported = typeof process !== 'undefined' && 
  (process.stdout?.isTTY || process.env.FORCE_COLOR !== undefined);

export const c = {
  reset: (s: string) => isColorSupported ? `\x1b[0m${s}\x1b[0m` : s,
  bold: (s: string) => isColorSupported ? `\x1b[1m${s}\x1b[22m` : s,
  dim: (s: string) => isColorSupported ? `\x1b[2m${s}\x1b[22m` : s,
  italic: (s: string) => isColorSupported ? `\x1b[3m${s}\x1b[23m` : s,
  underline: (s: string) => isColorSupported ? `\x1b[4m${s}\x1b[24m` : s,

  green: (s: string) => isColorSupported ? `\x1b[32m${s}\x1b[39m` : s,
  cyan: (s: string) => isColorSupported ? `\x1b[36m${s}\x1b[39m` : s,
  yellow: (s: string) => isColorSupported ? `\x1b[33m${s}\x1b[39m` : s,
  red: (s: string) => isColorSupported ? `\x1b[31m${s}\x1b[39m` : s,
  blue: (s: string) => isColorSupported ? `\x1b[34m${s}\x1b[39m` : s,
  magenta: (s: string) => isColorSupported ? `\x1b[35m${s}\x1b[39m` : s,
  gray: (s: string) => isColorSupported ? `\x1b[90m${s}\x1b[39m` : s,
};
