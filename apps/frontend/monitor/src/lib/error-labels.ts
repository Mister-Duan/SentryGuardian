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
