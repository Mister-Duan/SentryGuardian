import { getFetch } from '@sentry-guardian/browser-utils';
import { serializeEnvelope } from '@sentry-guardian/core';
import type { Envelope } from '@sentry-guardian/types';
import type { Transport, TransportOptions, TransportSendResult } from '@sentry-guardian/core';

const ENVELOPE_CONTENT_TYPE = 'application/x-sentry-guardian-envelope';

/**
 * Send envelopes via the Fetch API.
 * 通过 Fetch API 发送 Envelope。
 *
 * @example
 * ```ts
 * // Input / 输入
 * const t = new FetchTransport({ url: 'https://host/api/1/envelope/' });
 * await t.send(envelope);
 * // Output / 输出
 * { statusCode: 200 }
 * ```
 */
export class FetchTransport implements Transport {
  private url: string;
  private headers: Record<string, string>;

  constructor(options: TransportOptions) {
    this.url = options.url;
    this.headers = {
      'Content-Type': ENVELOPE_CONTENT_TYPE,
      ...options.headers,
    };
  }

  async send(envelope: Envelope): Promise<TransportSendResult> {
    const fetchFn = getFetch();
    if (!fetchFn) {
      return { statusCode: 503 };
    }

    const body = serializeEnvelope(envelope);
    const response = await fetchFn(this.url, {
      method: 'POST',
      headers: this.headers,
      body,
      keepalive: true,
    });

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    return { statusCode: response.status, headers };
  }
}
