import { performanceIntegration } from '@sentry-guardian/browser/performance';
import { browserTracingIntegration } from '@sentry-guardian/browser/tracing';

/** Slow-fetch threshold (ms) for examples — lower than production for easy demos. 示例慢请求阈值（低于生产便于演示）。 */
export const DEMO_SLOW_FETCH_THRESHOLD_MS = 300;

/**
 * User journey steps for perfume.js `markStep` demos.
 * perfume.js 用户旅程步骤配置（供 markStep 演示）。
 */
export const DEMO_USER_JOURNEY_STEPS = {
  demo_checkout: {
    threshold: 'quick',
    marks: ['demo_checkout_start', 'demo_checkout_end'],
  },
};

/**
 * Performance integrations shared by vanilla and vue-vite examples.
 * vanilla 与 vue-vite 示例共用的性能集成。
 *
 * @returns {import('@sentry-guardian/core').Integration[]}
 *
 * @example
 * ```js
 * // Input / 输入
 * import { init } from '@sentry-guardian/browser';
 * import { examplePerformanceIntegrations } from './example-performance.js';
 * init({ dsn, integrations: examplePerformanceIntegrations() })
 * ```
 */
export function examplePerformanceIntegrations() {
  return [
    performanceIntegration({ steps: DEMO_USER_JOURNEY_STEPS }),
    browserTracingIntegration({ slowThresholdMs: DEMO_SLOW_FETCH_THRESHOLD_MS }),
  ];
}
