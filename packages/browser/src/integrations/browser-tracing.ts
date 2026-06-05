import type { Client, Integration } from '@sentry-guardian/core';
import { getFetch } from '@sentry-guardian/browser-utils';

const SLOW_MS = 1000;

/**
 * Wrap fetch to report slow requests as transactions.
 * 包装 fetch，将慢请求作为事务上报。
 */
export function browserTracingIntegration(options?: { slowThresholdMs?: number }): Integration {
  const threshold = options?.slowThresholdMs ?? SLOW_MS;
  return {
    name: 'BrowserTracing',
    setup(client: Client) {
      const fetchFn = getFetch();
      if (!fetchFn || typeof window === 'undefined') {
        return;
      }
      const original = fetchFn.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const start = performance.now();
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        try {
          const response = await original(input, init);
          const duration = performance.now() - start;
          if (duration >= threshold) {
            client.captureTransaction({
              transaction: 'http.client',
              duration_ms: Math.round(duration),
              url,
              status_code: response.status,
            });
          }
          return response;
        } catch (err) {
          const duration = performance.now() - start;
          client.captureTransaction({
            transaction: 'http.client',
            duration_ms: Math.round(duration),
            url,
            status_code: 0,
          });
          throw err;
        }
      };
    },
  };
}
