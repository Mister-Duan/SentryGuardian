/**
 * @packageDocumentation
 * Optional slow-fetch tracing for SentryGuardian browser SDK.
 * SentryGuardian 浏览器 SDK 可选慢请求追踪子路径。
 *
 * Import from `@sentry-guardian/browser/tracing` without loading perfume.js.
 * 从此子路径导入，不加载 perfume.js。
 */

export {
  browserTracingIntegration,
  type BrowserTracingIntegrationOptions,
} from './integrations/browser-tracing.js';
