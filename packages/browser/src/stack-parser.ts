import type { StackFrame } from '@sentry-guardian/types';

const CHROME_LINE =
  /^\s*at (?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+)|([^)]+))\)?\s*$/;
const FIREFOX_LINE = /^(.*)@(.+?):(\d+):(\d+)$/;

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
  const inApp = !/^(node:|https?:\/\/)/.test(filename) && !filename.startsWith('<');
  return {
    filename,
    function: fn || '?',
    lineno,
    colno,
    in_app: inApp,
  };
}
