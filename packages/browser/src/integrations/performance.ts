import type { Client, Integration } from '@sentry-guardian/core';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof performance !== 'undefined';
}

/**
 * Capture Web Vitals (LCP, CLS, TTFB) as transaction events.
 * 采集 Web Vitals（LCP、CLS、TTFB）并作为事务事件上报。
 */
export function performanceIntegration(): Integration {
  return {
    name: 'Performance',
    setup(client: Client) {
      if (!isBrowser()) {
        return;
      }

      try {
        const po = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              client.captureTransaction({
                transaction: 'largest-contentful-paint',
                duration_ms: entry.startTime,
                metric: 'LCP',
                metric_value: entry.startTime,
              });
            }
            if (entry.entryType === 'layout-shift' && !(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
              client.captureTransaction({
                transaction: 'cumulative-layout-shift',
                duration_ms: 0,
                metric: 'CLS',
                metric_value: (entry as PerformanceEntry & { value?: number }).value ?? 0,
              });
            }
          }
        });
        po.observe({ type: 'largest-contentful-paint', buffered: true });
        po.observe({ type: 'layout-shift', buffered: true });
      } catch {
        // unsupported
      }

      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (nav) {
        client.captureTransaction({
          transaction: 'time-to-first-byte',
          duration_ms: nav.responseStart,
          metric: 'TTFB',
          metric_value: nav.responseStart,
        });
      }
    },
  };
}
