/**
 * @packageDocumentation
 * Optional performance metrics (perfume.js) for SentryGuardian browser SDK.
 * SentryGuardian 浏览器 SDK 可选性能指标子路径（perfume.js）。
 *
 * Import from `@sentry-guardian/browser/performance` to avoid pulling perfume.js
 * into apps that only need error monitoring.
 * 仅需错误监控的应用请从此子路径导入，避免主包捆绑 perfume.js。
 */

export {
  performanceIntegration,
  type PerformanceIntegrationOptions,
} from './integrations/performance.js';
export {
  clear,
  end,
  markNTBT,
  markStep,
  markStepOnce,
  start,
  trackUJNavigation,
} from 'perfume.js';
