import type { Envelope } from '@sentry-guardian/types';

/** Result of a transport send attempt. 传输层发送结果。 */
export interface TransportSendResult {
  statusCode: number;
  headers?: Record<string, string>;
}

/** Abstraction for sending envelopes to the ingest server. 向 ingest 发送 Envelope 的抽象。 */
export interface Transport {
  send(envelope: Envelope): Promise<TransportSendResult>;
  flush?(timeout?: number): Promise<boolean>;
  close?(timeout?: number): Promise<boolean>;
}

export interface TransportOptions {
  url: string;
  headers?: Record<string, string>;
}

/**
 * In-memory transport for tests; records sent envelopes.
 * 内存 Transport，供测试记录已发送 Envelope。
 *
 * @example
 * ```ts
 * // Input / 输入
 * const t = new MockTransport({ url: 'https://example/envelope/' });
 * await t.send(envelope);
 * t.sent.length
 * // Output / 输出
 * 1
 * ```
 */
export class MockTransport implements Transport {
  sent: Envelope[] = [];
  private url: string;

  constructor(options: TransportOptions) {
    this.url = options.url;
  }

  getUrl(): string {
    return this.url;
  }

  async send(envelope: Envelope): Promise<TransportSendResult> {
    this.sent.push(envelope);
    return { statusCode: 200 };
  }
}

/**
 * Transport that always returns a configurable status (e.g. 429).
 * 始终返回指定状态码的 Transport（如 429）。
 */
export class StatusTransport implements Transport {
  constructor(
    private statusCode: number,
    private headers: Record<string, string> = {},
  ) {}

  async send(envelope: Envelope): Promise<TransportSendResult> {
    void envelope;
    return { statusCode: this.statusCode, headers: this.headers };
  }
}
