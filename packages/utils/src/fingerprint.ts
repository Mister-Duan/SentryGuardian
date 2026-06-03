import { createHash } from 'node:crypto';
import type { StackFrame } from '@sentry-guardian/types';

/** Default number of stack frames used for grouping. 用于聚合的默认栈帧数量。 */
export const DEFAULT_FINGERPRINT_FRAME_COUNT = 5;

/**
 * Strip query string from filename or URL path for stable grouping.
 * 去掉文件名或 URL 中的 query，便于稳定聚合。
 *
 * @example
 * ```ts
 * // Input / 输入
 * normalizeFilename('https://cdn.example.com/app.js?v=2')
 * // Output / 输出
 * '/app.js'
 * ```
 */
export function normalizeFilename(filename?: string): string {
  if (!filename) return '<unknown>';
  try {
    const url = new URL(filename, 'http://localhost');
    return url.pathname;
  } catch {
    const q = filename.indexOf('?');
    return q >= 0 ? filename.slice(0, q) : filename;
  }
}

/**
 * Compute stable issue fingerprint from stack frames (MVP algorithm).
 * 根据栈帧计算稳定的 Issue 指纹（MVP 算法）。
 *
 * @example
 * ```ts
 * // Input / 输入
 * computeFingerprint([
 *   { filename: 'https://example.com/app.js?v=1', function: 'main', lineno: 10, in_app: true },
 *   { filename: 'https://example.com/lib.js', function: 'helper', lineno: 5, in_app: false },
 * ])
 * // Output / 输出（64 位十六进制，同输入恒等）
 * '1526a98580507a93895be696a181894ca7a25c58d9de72f3e20704640a5c6cf9'
 * ```
 */
export function computeFingerprint(
  frames: StackFrame[],
  frameCount = DEFAULT_FINGERPRINT_FRAME_COUNT,
): string {
  const inAppFrames = frames.filter((f) => f.in_app !== false);
  const source = inAppFrames.length > 0 ? inAppFrames : frames;
  const top = source.slice(-frameCount);
  const parts = top.map(
    (f) => `${normalizeFilename(f.filename)}|${f.function ?? '<anonymous>'}|${f.lineno ?? 0}`,
  );
  parts.sort();
  return createHash('sha256').update(parts.join('\n')).digest('hex');
}

/**
 * Fallback fingerprint when no stack is available.
 * 无堆栈时的回退指纹。
 *
 * @example
 * ```ts
 * // Input / 输入
 * computeFallbackFingerprint('TypeError', 'Cannot read property')
 * // Output / 输出（64 位十六进制）
 * '9d7afa8e2342016ccf3cab3c53ca9debea6d69e108cac30e50df389e6003bca0'
 * ```
 */
export function computeFallbackFingerprint(type: string, message: string): string {
  return createHash('sha256').update(`${type}|${message}`).digest('hex');
}
