import type { Breadcrumb, ExceptionValue, IssueStatus, StackFrame } from '@sentry-guardian/types';

/** Paths treated as third-party when inferring from culprit. 从 culprit 推断时视为三方库的路径模式。 */
const THIRD_PARTY_CULPRIT_PATTERNS = [
  /^node:/,
  /^chrome-extension:/,
  /^moz-extension:/,
  /node_modules/i,
  /webpack-internal/i,
];

/**
 * Infer whether a culprit string points at application code (fallback when API omits `culprit_in_app`).
 * 根据 culprit 字符串推断是否为应用代码（API 未返回 `culprit_in_app` 时的回退）。
 *
 * @example
 * ```ts
 * // Input / 输入
 * inferInAppFromCulprit('http://localhost/src/App.tsx:42')
 * // Output / 输出
 * true
 * inferInAppFromCulprit('webpack:///node_modules/react/index.js:1')
 * // Output / 输出
 * false
 * ```
 */
export function inferInAppFromCulprit(culprit: string): boolean {
  const filename = culprit.replace(/:\d+$/, '');
  if (filename.startsWith('<')) {
    return false;
  }
  return !THIRD_PARTY_CULPRIT_PATTERNS.some((pattern) => pattern.test(filename));
}

/**
 * Resolve in-app flag for issue list display.
 * 解析 Issue 列表展示用的 in-app 标记。
 */
export function resolveIssueCulpritInApp(
  culprit: string | undefined,
  stored?: boolean,
): boolean | undefined {
  if (stored != null) {
    return stored;
  }
  if (!culprit) {
    return undefined;
  }
  return inferInAppFromCulprit(culprit);
}

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
