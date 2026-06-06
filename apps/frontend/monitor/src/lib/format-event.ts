import type { Breadcrumb, ExceptionValue, IssueStatus, StackFrame } from '@sentry-guardian/types';

/**
 * Format a stack frame location for the issue detail UI.
 * 将栈帧格式化为 Issue 详情 UI 中的位置字符串。
 *
 * @example
 * ```ts
 * // Input / 输入
 * formatFrameLocation({ filename: 'app.js', function: 'onClick', lineno: 12, colno: 4 })
 * // Output / 输出
 * 'onClick (app.js:12:4)'
 * ```
 */
export function formatFrameLocation(frame: StackFrame): string {
  const fn = frame.function ?? '<anonymous>';
  const file = frame.filename ?? frame.module ?? '?';
  const line = frame.lineno != null ? `:${frame.lineno}` : '';
  const col = frame.colno != null ? `:${frame.colno}` : '';
  return `${fn} (${file}${line}${col})`;
}

/**
 * Headline for one exception value in the chain.
 * 异常链中单条异常的标题行。
 *
 * @example
 * ```ts
 * // Input / 输入
 * formatExceptionTitle({ type: 'TypeError', value: 'x is undefined' })
 * // Output / 输出
 * 'TypeError: x is undefined'
 * ```
 */
export function formatExceptionTitle(ex: ExceptionValue): string {
  return `${ex.type}: ${ex.value}`;
}

/**
 * Human-readable breadcrumb timestamp.
 * 面包屑时间戳的可读字符串。
 *
 * @example
 * ```ts
 * // Input / 输入
 * formatBreadcrumbTime(1717416000)
 * // Output / 输出（示例，依赖本地时区）
 * '2024/6/3 20:00:00'
 * ```
 */
export function formatBreadcrumbTime(timestamp?: number): string {
  if (timestamp == null) {
    return '—';
  }
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Issue status label for the console UI (Chinese).
 * 控制台 UI 使用的 Issue 状态中文标签。
 */
export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  unresolved: '未解决',
  resolved: '已解决',
  ignored: '已忽略',
};

/** Stack frames for display (newest call first). 用于展示的栈帧（最新调用在前）。 */
export function displayStackFrames(frames: StackFrame[]): StackFrame[] {
  return [...frames].reverse();
}

/**
 * Breadcrumbs for display (newest first by timestamp).
 * 用于展示的面包屑（按时间戳倒序，最新在前）。
 *
 * @example
 * ```ts
 * // Input / 输入
 * displayBreadcrumbs([
 *   { timestamp: 1, message: 'old' },
 *   { timestamp: 3, message: 'new' },
 * ])
 * // Output / 输出
 * [{ timestamp: 3, message: 'new' }, { timestamp: 1, message: 'old' }]
 * ```
 */
export function displayBreadcrumbs(breadcrumbs: Breadcrumb[]): Breadcrumb[] {
  return [...breadcrumbs].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
}
