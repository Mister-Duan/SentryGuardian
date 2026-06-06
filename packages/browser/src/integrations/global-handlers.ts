import type { Client, CaptureHint, Integration } from '@sentry-guardian/core';

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
        if (event.target && event.target !== window) {
          return;
        }

        if (event instanceof ErrorEvent) {
          if (event.error !== undefined) {
            client.captureException(event.error, { mechanism: 'onerror' });
            return;
          }

          const hint: CaptureHint = {
            mechanism: 'onerror',
            tags: { 'error.type': 'javascript' },
            extra: {
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno,
            },
            syntheticLocation: event.filename
              ? {
                  filename: event.filename,
                  lineno: event.lineno,
                  colno: event.colno,
                }
              : undefined,
          };
          client.captureException(String(event.message), hint);
          return;
        }

        client.captureException('Unknown error', { mechanism: 'onerror' });
      };

      const onRejection = (event: PromiseRejectionEvent) => {
        client.captureException(event.reason, {
          mechanism: 'onunhandledrejection',
          tags: { 'error.type': 'unhandledrejection' },
        });
      };

      window.addEventListener('error', onError);
      window.addEventListener('unhandledrejection', onRejection);
    },
  };
}
