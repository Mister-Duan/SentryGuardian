import type { Client, Integration } from '@sentry-guardian/core';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

const RESOURCE_TAGS = new Set([
  'script',
  'img',
  'link',
  'iframe',
  'video',
  'audio',
  'source',
]);

function resourceSrc(element: HTMLElement): string | undefined {
  const el = element as HTMLScriptElement & HTMLImageElement & HTMLLinkElement;
  return el.src || el.href || undefined;
}

/**
 * Capture resource load failures (script, image, media, iframe, etc.).
 * 捕获资源加载失败（script、图片、媒体、iframe 等）。
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
          if (!tag || !RESOURCE_TAGS.has(tag)) {
            return;
          }
          const src = resourceSrc(element);
          client.captureException(`Resource failed to load: ${tag}${src ? ` ${src}` : ''}`, {
            mechanism: 'onerror',
            tags: {
              'error.type': 'resource',
              'resource.tag': tag,
            },
            extra: { tag, src },
          });
        },
        true,
      );
    },
  };
}
