/** Chinese labels for SDK capture mechanisms. SDK 捕获机制中文标签。 */
export const MECHANISM_LABELS: Record<string, string> = {
  onerror: '全局错误',
  onunhandledrejection: '未处理 Promise',
  onsecuritypolicyviolation: 'CSP 违规',
  'http.client': 'Fetch 请求',
  xhr: 'XHR 请求',
  console: 'Console',
  generic: '手动捕获',
};

/** Chinese labels for error.type tags. error.type 标签中文名。 */
export const ERROR_TYPE_LABELS: Record<string, string> = {
  javascript: 'JavaScript',
  resource: '资源加载',
  csp: 'CSP',
  http: 'HTTP',
  console: 'Console',
  unhandledrejection: 'Promise 拒绝',
};

export const LEVEL_LABELS: Record<string, string> = {
  fatal: '致命',
  error: '错误',
  warning: '警告',
  info: '信息',
  debug: '调试',
};

export function labelMechanism(key: string): string {
  return MECHANISM_LABELS[key] ?? key;
}

export function labelErrorType(key: string): string {
  return ERROR_TYPE_LABELS[key] ?? key;
}

export function labelLevel(key: string): string {
  return LEVEL_LABELS[key] ?? key;
}

/** Label for in-app stack frames. 应用内栈帧标签。 */
export const FRAME_IN_APP_LABEL = 'In App';

/** Label for third-party / library stack frames. 三方库栈帧标签。 */
export const FRAME_LIBRARY_LABEL = 'Library';

/**
 * Human-readable label for stack frame origin (in-app vs library).
 * 栈帧来源（应用内 vs 三方库）的可读标签。
 *
 * @example
 * ```ts
 * // Input / 输入
 * labelFrameOrigin(true)
 * // Output / 输出
 * 'In App'
 * labelFrameOrigin(false)
 * // Output / 输出
 * 'Library'
 * ```
 */
export function labelFrameOrigin(inApp?: boolean): string | undefined {
  if (inApp === true) {
    return FRAME_IN_APP_LABEL;
  }
  if (inApp === false) {
    return FRAME_LIBRARY_LABEL;
  }
  return undefined;
}

/** Known capture mechanism keys for filter dropdowns. 捕获机制筛选项键列表。 */
export const MECHANISM_FILTER_OPTIONS = Object.keys(MECHANISM_LABELS);

/** Known severity level keys for filter dropdowns. 严重级别筛选项键列表。 */
export const LEVEL_FILTER_OPTIONS = Object.keys(LEVEL_LABELS);
