import type { Envelope } from '@sentry-guardian/types';

/**
 * Result of a transport send attempt.
 * 传输层单次发送尝试的结果。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const result: TransportSendResult = { statusCode: 200, headers: {} };
 * ```
 */
export interface TransportSendResult {
  /** HTTP status from ingest (200 = accepted). ingest 返回的 HTTP 状态（200 表示接受）。 */
  statusCode: number;
  /** Response headers (e.g. `retry-after` on 429). 响应头（如 429 时的 `retry-after`）。 */
  headers?: Record<string, string>;
}

/**
 * Abstraction for sending envelopes to the ingest server.
 * 向 ingest 服务端发送 Envelope 的抽象。
 */
export interface Transport {
  /** POST one envelope; may buffer internally. 发送一个 Envelope；实现可内部缓冲。 */
  send(envelope: Envelope): Promise<TransportSendResult>;
  /** Drain pending envelopes within `timeout` ms. 在 `timeout` 毫秒内排空待发送队列。 */
  flush?(timeout?: number): Promise<boolean>;
  /** Stop accepting new sends and flush (best effort). 停止接收新发送并尽力 flush。 */
  close?(timeout?: number): Promise<boolean>;
}

/**
 * Common constructor options for HTTP transports.
 * HTTP 类 Transport 的通用构造选项。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const options: TransportOptions = {
 *   url: 'http://localhost:3001/api/sentry/demo/envelope/',
 * };
 * ```
 */
export interface TransportOptions {
  /** Ingest envelope endpoint URL. ingest Envelope 端点 URL。 */
  url: string;
  /** Extra headers merged into each request. 合并进每次请求的额外头。 */
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
  /** Envelopes captured by {@link send}. {@link send} 捕获到的 Envelope 列表。 */
  sent: Envelope[] = [];
  private url: string;

  constructor(options: TransportOptions) {
    this.url = options.url;
  }

  /**
   * Configured ingest URL (for assertions).
   * 配置的 ingest URL（供断言使用）。
   *
   * @example
   * ```ts
   * // Input / 输入
   * new MockTransport({ url: 'https://host/envelope/' }).getUrl()
   * // Output / 输出
   * 'https://host/envelope/'
   * ```
   */
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
 * 始终返回指定状态码的 Transport（如 429），用于重试测试。
 *
 * @example
 * ```ts
 * // Input / 输入
 * const t = new StatusTransport(429, { 'retry-after': '1' });
 * await t.send(envelope);
 * // Output / 输出
 * { statusCode: 429, headers: { 'retry-after': '1' } }
 * ```
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
