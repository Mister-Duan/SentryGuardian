import type { Integration } from '@sentry-guardian/core';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Attach current page URL and referrer to events.
 * 为事件附加当前页面 URL 与 Referrer。
 *
 * @example
 * ```ts
 * // Input / 输入
 * httpContextIntegration().name
 * // Output / 输出
 * 'HttpContext'
 * ```
 */
export function httpContextIntegration(): Integration {
  return {
    name: 'HttpContext',
    setup(client) {
      if (!isBrowser()) {
        return;
      }

      client.addBeforeSend((event) => {
        const headers: Record<string, string> = { ...event.request?.headers };
        if (document.referrer) {
          headers.Referer = document.referrer;
        }
        return {
          ...event,
          request: {
            ...event.request,
            url: window.location.href,
            headers,
          },
        };
      });
    },
  };
}
