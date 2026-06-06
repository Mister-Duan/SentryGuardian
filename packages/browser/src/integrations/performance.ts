import type { Client, Integration } from '@sentry-guardian/core';
import { initPerfume, type IPerfumeOptions } from 'perfume.js';
import { isUrlDenied, type UrlPatternList } from '../lib/url-match.js';
import { resolvePerformanceDenyUrls } from '../performance/resolve-deny-urls.js';
import { createPerformanceBatchCapture } from './performance-batch.js';
import { mapPerfumeReport } from './perfume-bridge.js';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof performance !== 'undefined';
}

/**
 * Options for {@link performanceIntegration} (wraps perfume.js `initPerfume`).
 * {@link performanceIntegration} 选项（封装 perfume.js `initPerfume`）。
 */
export type PerformanceIntegrationOptions = Pick<
  IPerfumeOptions,
  'resourceTiming' | 'elementTiming' | 'maxMeasureTime' | 'reportOptions' | 'steps' | 'onMarkStep'
> & {
  /**
   * URL substrings or regexes excluded from resource timing transactions (not error events).
   * 从 resource timing 事务中排除的 URL 子串或正则（不影响错误事件）。
   * @example
   * ```ts
   * performanceIntegration({ denyUrls: [/analytics\.example\.com/] })
   * ```
   */
  denyUrls?: UrlPatternList;
  /**
   * When false, SDK ingest URLs are not auto-excluded from performance.
   * 为 false 时不自动排除 SDK ingest URL。
   * @default true
   * @example
   * ```ts
   * performanceIntegration({ ignoreIngest: false })
   * ```
   */
  ignoreIngest?: boolean;
};

/**
 * Capture field performance metrics via [perfume.js](https://github.com/Zizzamia/perfume.js).
 * 通过 perfume.js 采集完整字段性能指标并映射为事务事件。
 *
 * Default: Web Vitals (TTFB, FCP, LCP, CLS, FID, INP, TBT), navigation/network/storage,
 * resource timing, and element timing when supported.
 *
 * 默认启用 Web Vitals、Navigation/Network/Storage、Resource Timing、Element Timing（浏览器支持时）。
 */
export function performanceIntegration(
  options: PerformanceIntegrationOptions = {},
): Integration {
  return {
    name: 'Performance',
    setup(client: Client) {
      if (!isBrowser()) {
        return;
      }

      const clientOpts = client.getOptions();
      const denyUrls = resolvePerformanceDenyUrls({
        dsn: clientOpts.dsn,
        ingestUrl: clientOpts.ingestUrl,
        denyUrls: options.denyUrls,
        ignoreIngest: options.ignoreIngest,
      });
      const shouldDenyUrl = (url: string) => isUrlDenied(denyUrls, url);
      const capturePartial = createPerformanceBatchCapture(client);

      initPerfume({
        resourceTiming: options.resourceTiming ?? true,
        elementTiming: options.elementTiming ?? true,
        maxMeasureTime: options.maxMeasureTime,
        reportOptions: {
          lcp: { reportAllChanges: true, ...options.reportOptions?.lcp },
          cls: options.reportOptions?.cls,
          fcp: options.reportOptions?.fcp,
          fid: options.reportOptions?.fid,
          inp: options.reportOptions?.inp,
          ttfb: options.reportOptions?.ttfb,
        },
        steps: options.steps,
        onMarkStep: options.onMarkStep,
        analyticsTracker: (report) => {
          if (report.metricName === 'resourceTiming' && report.data && typeof report.data === 'object') {
            const name = (report.data as PerformanceResourceTiming).name;
            if (name && shouldDenyUrl(name)) {
              return;
            }
          }
          for (const partial of mapPerfumeReport(report, shouldDenyUrl)) {
            capturePartial(partial);
          }
        },
      });
    },
  };
}
