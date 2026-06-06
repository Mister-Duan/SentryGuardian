import type { Client, Integration } from '@sentry-guardian/core';
import { getFetch } from '@sentry-guardian/browser-utils';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export type HttpErrorsOptions = {
  /** HTTP status codes treated as errors (default 400–599). 视为错误的 HTTP 状态码。 */
  failedStatusCodes?: number[];
};

const DEFAULT_FAILED = Array.from({ length: 200 }, (_, i) => i + 400);

/**
 * Capture failed `fetch` / `XMLHttpRequest` responses as error events.
 * 将失败的 `fetch` / `XMLHttpRequest` 响应捕获为错误事件。
 *
 * @example
 * ```ts
 * // Input / 输入
 * httpErrorsIntegration({ failedStatusCodes: [400, 500] }).name
 * // Output / 输出
 * 'HttpErrors'
 * ```
 */
export function httpErrorsIntegration(options?: HttpErrorsOptions): Integration {
  const failedCodes = new Set(options?.failedStatusCodes ?? DEFAULT_FAILED);

  return {
    name: 'HttpErrors',
    setup(client: Client) {
      if (!isBrowser()) {
        return;
      }

      const scope = client.getScope().get();

      const addHttpBreadcrumb = (
        method: string,
        url: string,
        status: number,
        durationMs?: number,
      ) => {
        scope.addBreadcrumb({
          type: 'http',
          category: 'xhr',
          data: { method, url, status_code: status, duration_ms: durationMs },
          timestamp: Date.now() / 1000,
        });
      };

      const captureHttpError = (
        method: string,
        url: string,
        status: number,
        mechanism: string,
      ) => {
        client.captureException(`HTTP ${status}: ${method} ${url}`, {
          mechanism,
          tags: {
            'error.type': 'http',
            'http.status_code': String(status),
            'http.method': method,
          },
          extra: { url, status_code: status, method },
        });
      };

      const fetchFn = getFetch();
      if (fetchFn) {
        const original = fetchFn.bind(window);
        window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
          const url =
            typeof input === 'string'
              ? input
              : input instanceof URL
                ? input.href
                : input.url;
          const start = performance.now();
          try {
            const response = await original(input, init);
            const duration = Math.round(performance.now() - start);
            addHttpBreadcrumb(method, url, response.status, duration);
            if (failedCodes.has(response.status)) {
              captureHttpError(method, url, response.status, 'http.client');
            }
            return response;
          } catch (err) {
            const duration = Math.round(performance.now() - start);
            addHttpBreadcrumb(method, url, 0, duration);
            client.captureException(err, {
              mechanism: 'http.client',
              tags: { 'error.type': 'http', 'http.method': method },
              extra: { url, method, network_error: true },
            });
            throw err;
          }
        };
      }

      const XHR = window.XMLHttpRequest;
      if (!XHR) {
        return;
      }

      const open = XHR.prototype.open;
      const send = XHR.prototype.send;

      const patchedOpen = function (
        this: XMLHttpRequest,
        ...args: Parameters<XMLHttpRequest['open']>
      ) {
        const meta = this as XMLHttpRequest & { __sg_method?: string; __sg_url?: string };
        meta.__sg_method = String(args[0]);
        meta.__sg_url = String(args[1]);
        return open.apply(this, args);
      } as XMLHttpRequest['open'];
      XHR.prototype.open = patchedOpen;

      XHR.prototype.send = function (this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null) {
        const meta = this as XMLHttpRequest & { __sg_method?: string; __sg_url?: string };
        const method = meta.__sg_method ?? 'GET';
        const url = meta.__sg_url ?? '';
        const start = performance.now();

        this.addEventListener('loadend', () => {
          const duration = Math.round(performance.now() - start);
          addHttpBreadcrumb(method, url, this.status, duration);
          if (failedCodes.has(this.status)) {
            captureHttpError(method, url, this.status, 'xhr');
          }
        });

        return send.call(this, body);
      };
    },
  };
}
