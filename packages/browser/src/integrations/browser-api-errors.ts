import type { Client, Integration } from '@sentry-guardian/core';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Capture script / image / link resource load failures.
 * 捕获 script / img / link 等资源加载失败。
 *
 * @example
 * ```ts
 * // Input / 输入
 * browserApiErrorsIntegration().name
 * // Output / 输出
 * 'BrowserApiErrors'
 * ```
 */
export function browserApiErrorsIntegration(): Integration {
  return {
    name: 'BrowserApiErrors',
    setup(client: Client) {
      if (!isBrowser()) {
        return;
      }

      window.addEventListener(
        'error',
        (event: Event) => {
          const target = event.target;
          if (!target || target === window) {
            return;
          }
          const element = target as HTMLElement;
          const tag = element.tagName?.toLowerCase();
          if (tag !== 'script' && tag !== 'img' && tag !== 'link') {
            return;
          }
          const src =
            (element as HTMLScriptElement).src ||
            (element as HTMLImageElement).src ||
            (element as HTMLLinkElement).href;
          client.captureException(`Resource failed to load: ${tag} ${src}`, {
            mechanism: 'onerror',
          });
        },
        true,
      );
    },
  };
}
