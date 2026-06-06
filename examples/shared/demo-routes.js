/** Demo tab ids. 演示 Tab 标识。 */
export const DEMO_TAB_ERROR = 'error';
export const DEMO_TAB_PERF = 'perf';

/** Tab metadata for error vs performance demos. 错误与性能演示 Tab 元数据。 */
export const DEMO_TABS = [
  {
    id: DEMO_TAB_ERROR,
    path: '/error',
    label: '错误采集',
    description: '默认错误集成与手动 API；上报后在控制台 Issues 页查看。',
  },
  {
    id: DEMO_TAB_PERF,
    path: '/perf',
    label: '性能采集',
    description:
      'perfume.js 指标演示：说明 perfume 回调时机（idle / hidden）与 SDK 上报差异；慢请求走 browserTracing。结果在控制台「性能」页查看。',
  },
];

/**
 * Resolve active tab from pathname.
 * 根据路径解析当前 Tab。
 *
 * @param {string} [pathname]
 * @returns {'error' | 'perf'}
 */
export function resolveDemoTab(pathname = window.location.pathname) {
  if (pathname.endsWith('/perf')) {
    return DEMO_TAB_PERF;
  }
  return DEMO_TAB_ERROR;
}

/**
 * Path for a tab id.
 * 获取 Tab 对应路径。
 *
 * @param {'error' | 'perf'} tabId
 */
export function pathForDemoTab(tabId) {
  return DEMO_TABS.find((t) => t.id === tabId)?.path ?? '/error';
}

/**
 * Ensure URL uses /error or /perf (default /error).
 * 将根路径规范到 /error 或 /perf（默认 /error）。
 */
export function normalizeDemoPath() {
  const path = window.location.pathname;
  if (path.endsWith('/perf') || path.endsWith('/error')) {
    return resolveDemoTab(path);
  }
  history.replaceState({ tab: DEMO_TAB_ERROR }, '', pathForDemoTab(DEMO_TAB_ERROR));
  return DEMO_TAB_ERROR;
}

/**
 * @param {'error' | 'perf'} tabId
 */
export function navigateDemoTab(tabId) {
  const next = pathForDemoTab(tabId);
  if (!window.location.pathname.endsWith(next)) {
    history.pushState({ tab: tabId }, '', next);
  }
}
