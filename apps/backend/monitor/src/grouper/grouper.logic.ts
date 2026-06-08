import type { ErrorEvent, StackFrame } from '@sentry-guardian/types';
import { computeFallbackFingerprint, computeFingerprint } from '@sentry-guardian/utils';

/**
 * Derive issue title from an error event.
 * 从错误事件生成 Issue 标题。
 *
 * @example
 * ```ts
 * // Input / 输入
 * eventTitle({ exception: { values: [{ type: 'Error', value: 'boom' }] } })
 * // Output / 输出
 * 'boom'
 * ```
 */
export function eventTitle(event: ErrorEvent): string {
  const ex = event.exception?.values?.[0];
  if (ex?.value) {
    return ex.value.slice(0, 200);
  }
  return event.message?.slice(0, 200) ?? 'Unknown error';
}

/**
 * Compute grouping fingerprint for an error event.
 * 计算错误事件的聚合指纹。
 *
 * @example
 * ```ts
 * // Input / 输入
 * eventFingerprint({ fingerprint: ['custom'] })
 * // Output / 输出
 * 'custom'
 * ```
 */
export function eventFingerprint(event: ErrorEvent): string {
  if (event.fingerprint?.length) {
    return event.fingerprint.join(':');
  }
  const ex = event.exception?.values?.[0];
  const frames: StackFrame[] = ex?.stacktrace?.frames ?? [];
  if (frames.length > 0) {
    return computeFingerprint(frames);
  }
  return computeFallbackFingerprint(ex?.type ?? 'Error', ex?.value ?? event.message ?? '');
}

/**
 * Pick the display culprit frame (prefers top in-app frame).
 * 选取用于展示的 culprit 栈帧（优先栈顶 in-app 帧）。
 */
function pickCulpritFrame(event: ErrorEvent): StackFrame | undefined {
  const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];
  const inApp = [...frames].reverse().find((f) => f.in_app !== false);
  return inApp ?? frames[frames.length - 1];
}

/**
 * Culprit location and whether it is application code.
 * culprit 位置及其是否为应用代码。
 *
 * @example
 * ```ts
 * // Input / 输入
 * eventCulpritInfo({
 *   exception: {
 *     values: [{
 *       type: 'Error',
 *       value: 'x',
 *       stacktrace: { frames: [{ filename: 'app.js', lineno: 10, in_app: true }] },
 *     }],
 *   },
 * })
 * // Output / 输出
 * { culprit: 'app.js:10', culprit_in_app: true }
 * ```
 */
export function eventCulpritInfo(event: ErrorEvent): {
  culprit?: string;
  culprit_in_app?: boolean;
} {
  const frame = pickCulpritFrame(event);
  if (!frame?.filename) {
    return {};
  }
  return {
    culprit: `${frame.filename}:${frame.lineno ?? 0}`,
    culprit_in_app: frame.in_app !== false,
  };
}

/**
 * Pick culprit string from top in-app frame.
 * 从栈顶应用帧提取 culprit。
 *
 * @example
 * ```ts
 * // Input / 输入
 * eventCulprit({
 *   exception: {
 *     values: [{
 *       type: 'Error',
 *       value: 'x',
 *       stacktrace: { frames: [{ filename: 'app.js', lineno: 10, in_app: true }] },
 *     }],
 *   },
 * })
 * // Output / 输出
 * 'app.js:10'
 * ```
 */
export function eventCulprit(event: ErrorEvent): string | undefined {
  return eventCulpritInfo(event).culprit;
}
