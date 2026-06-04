import type { Client, Integration } from '@sentry-guardian/core';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Capture `window.onerror` and unhandled promise rejections.
 * 捕获 `window.onerror` 与未处理的 Promise 拒绝。
 *
 * @example
 * ```ts
 * // Input / 输入
 * globalHandlersIntegration().name
 * // Output / 输出
 * 'GlobalHandlers'
 * ```
 */
export function globalHandlersIntegration(): Integration {
  let installed = false;

  return {
    name: 'GlobalHandlers',
    setupOnce() {
      if (!isBrowser() || installed) {
        return;
      }
      installed = true;
    },
    setup(client: Client) {
      if (!isBrowser()) {
        return;
      }

      const onError = (event: Event) => {
        if (event instanceof ErrorEvent && event.error !== undefined) {
          client.captureException(event.error, { mechanism: 'onerror' });
          return;
        }
        const message =
          event instanceof ErrorEvent ? String(event.message) : 'Unknown error';
        client.captureException(message, { mechanism: 'onerror' });
      };

      const onRejection = (event: PromiseRejectionEvent) => {
        client.captureException(event.reason, { mechanism: 'onunhandledrejection' });
      };

      window.addEventListener('error', onError);
      window.addEventListener('unhandledrejection', onRejection);
    },
  };
}
