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
 * Pick culprit string from top in-app frame.
 * 从栈顶应用帧提取 culprit。
 */
export function eventCulprit(event: ErrorEvent): string | undefined {
  const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];
  const inApp = [...frames].reverse().find((f) => f.in_app !== false);
  const frame = inApp ?? frames[frames.length - 1];
  if (!frame?.filename) {
    return undefined;
  }
  return `${frame.filename}:${frame.lineno ?? 0}`;
}
