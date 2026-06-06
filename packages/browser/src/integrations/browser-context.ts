import type { Integration } from '@sentry-guardian/core';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

/**
 * Attach browser / device context to every error event.
 * 为每条错误事件附加浏览器与设备上下文。
 *
 * @example
 * ```ts
 * // Input / 输入
 * browserContextIntegration().name
 * // Output / 输出
 * 'BrowserContext'
 * ```
 */
export function browserContextIntegration(): Integration {
  return {
    name: 'BrowserContext',
    setup(client) {
      if (!isBrowser()) {
        return;
      }

      client.addBeforeSend((event) => ({
        ...event,
        extra: {
          ...event.extra,
          browser: {
            user_agent: navigator.userAgent,
            language: navigator.language,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight,
            },
            screen: {
              width: window.screen?.width,
              height: window.screen?.height,
            },
          },
        },
      }));
    },
  };
}
