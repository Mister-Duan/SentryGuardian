import type { StackFrame } from '@sentry-guardian/types';

const CHROME_LINE =
  /^\s*at (?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+)|([^)]+))\)?\s*$/;
const FIREFOX_LINE = /^(.*)@(.+?):(\d+):(\d+)$/;

/** Paths treated as third-party / non-application code. 视为三方库或非应用代码的路径模式。 */
const THIRD_PARTY_PATTERNS = [
  /^node:/,
  /^chrome-extension:/,
  /^moz-extension:/,
  /node_modules/i,
  /webpack-internal/i,
];

/**
 * Whether a stack frame filename belongs to application code.
 * 判断栈帧文件名是否属于应用代码。
 *
 * @example
 * ```ts
 * // Input / 输入
 * isInAppFrame('http://localhost/src/App.tsx')
 * // Output / 输出
 * true
 * isInAppFrame('webpack:///node_modules/react/index.js')
 * // Output / 输出
 * false
 * ```
 */
export function isInAppFrame(filename: string): boolean {
  if (filename.startsWith('<')) {
    return false;
  }
  return !THIRD_PARTY_PATTERNS.some((pattern) => pattern.test(filename));
}

/**
 * Parse a JS Error stack string into frames (oldest first).
 * 将 JS Error.stack 解析为栈帧（最旧帧在前）。
 *
 * @example
 * ```ts
 * // Input / 输入
 * parseStack('Error: x\n    at foo (app.js:10:5)')
 * // Output / 输出
 * [{ filename: 'app.js', function: 'foo', lineno: 10, colno: 5, in_app: true }]
 * ```
 */
export function parseStack(stack?: string): StackFrame[] {
  if (!stack) {
    return [];
  }

  const lines = stack.split('\n').slice(1);
  const frames: StackFrame[] = [];

  for (const line of lines) {
    const frame = parseStackLine(line.trim());
    if (frame) {
      frames.push(frame);
    }
  }

  return frames.reverse();
}

function parseStackLine(line: string): StackFrame | null {
  const chrome = CHROME_LINE.exec(line);
  if (chrome) {
    const fn = chrome[1];
    const filename = chrome[2] ?? chrome[5];
    const lineno = chrome[3] ? Number(chrome[3]) : undefined;
    const colno = chrome[4] ? Number(chrome[4]) : undefined;
    if (!filename) {
      return null;
    }
    return frameFromParts(filename, fn, lineno, colno);
  }

  const firefox = FIREFOX_LINE.exec(line);
  if (firefox) {
    const fn = firefox[1];
    const filename = firefox[2];
    const lineno = Number(firefox[3]);
    const colno = Number(firefox[4]);
    if (!filename) {
      return null;
    }
    return frameFromParts(filename, fn || undefined, lineno, colno);
  }

  return null;
}

function frameFromParts(
  filename: string,
  fn: string | undefined,
  lineno: number | undefined,
  colno: number | undefined,
): StackFrame {
  const inApp = isInAppFrame(filename);
  return {
    filename,
    function: fn || '?',
    lineno,
    colno,
    in_app: inApp,
  };
}
