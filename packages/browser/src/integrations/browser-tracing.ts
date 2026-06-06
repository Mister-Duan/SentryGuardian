import type { Client, Integration } from '@sentry-guardian/core';
import { getFetch } from '@sentry-guardian/browser-utils';
import { isUrlDenied, type UrlPatternList } from '../lib/url-match.js';
import { resolvePerformanceDenyUrls } from '../performance/resolve-deny-urls.js';

const SLOW_MS = 1000;

/** Options for {@link browserTracingIntegration}. {@link browserTracingIntegration} 配置项。 */
export type BrowserTracingIntegrationOptions = {
  /** Minimum fetch duration (ms) before reporting as `http.client`. 上报 `http.client` 的最小 fetch 耗时（毫秒）。 */
  slowThresholdMs?: number;
  /**
   * URL substrings or regexes excluded from slow fetch transactions (not error events).
   * 从慢 fetch 事务中排除的 URL 子串或正则（不影响错误事件）。
   * @example
   * ```ts
   * browserTracingIntegration({ denyUrls: [/health/] })
   * ```
   */
  denyUrls?: UrlPatternList;
  /**
   * When false, SDK ingest URLs are not auto-excluded from performance.
   * 为 false 时不自动排除 SDK ingest URL。
   * @default true
   * @example
   * ```ts
   * browserTracingIntegration({ ignoreIngest: false })
   * ```
   */
  ignoreIngest?: boolean;
};

/**
 * Wrap fetch to report slow requests as transactions.
 * 包装 fetch，将慢请求作为事务上报。
 */
export function browserTracingIntegration(
  options: BrowserTracingIntegrationOptions = {},
): Integration {
  const threshold = options.slowThresholdMs ?? SLOW_MS;
  return {
    name: 'BrowserTracing',
    setup(client: Client) {
      const fetchFn = getFetch();
      if (!fetchFn || typeof window === 'undefined') {
        return;
      }

      const clientOpts = client.getOptions();
      const denyUrls = resolvePerformanceDenyUrls({
        dsn: clientOpts.dsn,
        ingestUrl: clientOpts.ingestUrl,
        denyUrls: options.denyUrls,
        ignoreIngest: options.ignoreIngest,
      });
      const shouldSkipUrl = (url: string) => isUrlDenied(denyUrls, url);

      const original = fetchFn.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const start = performance.now();
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        try {
          const response = await original(input, init);
          const duration = performance.now() - start;
          if (duration >= threshold && !shouldSkipUrl(url)) {
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
          if (!shouldSkipUrl(url)) {
            client.captureTransaction({
              transaction: 'http.client',
              duration_ms: Math.round(duration),
              url,
              status_code: 0,
            });
          }
          throw err;
        }
      };
    },
  };
}
