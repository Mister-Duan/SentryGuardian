import type { Integration } from '@sentry-guardian/core';
import type { ErrorEvent } from '@sentry-guardian/types';

/**
 * Options for {@link inboundFiltersIntegration}.
 * {@link inboundFiltersIntegration} 的配置项。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const options: InboundFiltersOptions = {
 *   denyUrls: [/chrome-extension:\/\//],
 *   allowUrls: [/^https:\/\/app\.example\.com/],
 * };
 * ```
 */
export interface InboundFiltersOptions {
  /** URL substrings or regexes that drop matching events. 匹配则丢弃事件的 URL 子串或正则。 */
  denyUrls?: Array<string | RegExp>;
  /** If set, only URLs matching at least one pattern are kept. 若设置，仅保留匹配任一模式的 URL。 */
  allowUrls?: Array<string | RegExp>;
}

function urlMatches(patterns: Array<string | RegExp>, url: string): boolean {
  return patterns.some((pattern) =>
    typeof pattern === 'string' ? url.includes(pattern) : pattern.test(url),
  );
}

/**
 * Filter events by request URL (denyUrls / allowUrls).
 * 按请求 URL 过滤事件（denyUrls / allowUrls）。
 *
 * @example
 * ```ts
 * // Input / 输入
 * inboundFiltersIntegration({ denyUrls: [/extensions\//] }).name
 * // Output / 输出
 * 'InboundFilters'
 * ```
 */
export function inboundFiltersIntegration(options: InboundFiltersOptions = {}): Integration {
  const denyUrls = options.denyUrls ?? [];
  const allowUrls = options.allowUrls ?? [];

  return {
    name: 'InboundFilters',
    setup(client) {
      if (denyUrls.length === 0 && allowUrls.length === 0) {
        return;
      }

      client.addBeforeSend((event: ErrorEvent) => {
        const url = event.request?.url ?? '';
        if (!url) {
          return event;
        }
        if (denyUrls.length > 0 && urlMatches(denyUrls, url)) {
          return null;
        }
        if (allowUrls.length > 0 && !urlMatches(allowUrls, url)) {
          return null;
        }
        return event;
      });
    },
  };
}
