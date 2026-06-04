import type { Envelope } from '@sentry-guardian/types';
import type { Transport, TransportSendResult } from './base.js';

interface BufferedItem {
  envelope: Envelope;
  attempts: number;
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 10;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(headers?: Record<string, string>): number {
  if (!headers) return DEFAULT_RETRY_DELAY_MS;
  const raw = headers['retry-after'] ?? headers['Retry-After'];
  if (!raw) return DEFAULT_RETRY_DELAY_MS;
  const seconds = parseInt(raw, 10);
  return Number.isNaN(seconds) ? DEFAULT_RETRY_DELAY_MS : seconds * 1000;
}

/**
 * Wraps a transport with buffering and 429 backoff retry.
 * 为 Transport 提供缓冲与 429 退避重试。
 *
 * @example
 * ```ts
 * // Input / 输入
 * const inner = new StatusTransport(429, { 'retry-after': '0' });
 * const buf = new BufferTransport(inner, 2, 1);
 * await buf.send(envelope);
 * // Output / 输出（inner 被调用次数 > 0，最终 buffer 可能清空或保留）
 * true
 * ```
 */
export class BufferTransport implements Transport {
  private buffer: BufferedItem[] = [];
  private sending = false;
  private closed = false;

  constructor(
    private inner: Transport,
    private maxRetries = DEFAULT_MAX_RETRIES,
    private retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  ) {}

  getPendingCount(): number {
    return this.buffer.length;
  }

  async send(envelope: Envelope): Promise<TransportSendResult> {
    if (this.closed) {
      return { statusCode: 503 };
    }
    this.buffer.push({ envelope, attempts: 0 });
    return this.flushOnce();
  }

  async flush(timeout = 2000): Promise<boolean> {
    const start = Date.now();
    while (this.buffer.length > 0 && Date.now() - start < timeout) {
      await this.flushOnce();
      if (this.buffer.length > 0) {
        await sleep(5);
      }
    }
    return this.buffer.length === 0;
  }

  async close(timeout = 2000): Promise<boolean> {
    this.closed = true;
    return this.flush(timeout);
  }

  private async flushOnce(): Promise<TransportSendResult> {
    if (this.sending || this.buffer.length === 0) {
      return { statusCode: 200 };
    }
    this.sending = true;
    try {
      while (this.buffer.length > 0) {
        const item = this.buffer[0]!;
        const result = await this.inner.send(item.envelope);
        if (result.statusCode === 200) {
          this.buffer.shift();
          continue;
        }
        if (result.statusCode === 429) {
          await sleep(parseRetryAfterMs(result.headers));
          item.attempts += 1;
          if (item.attempts >= this.maxRetries) {
            this.buffer.shift();
          }
          break;
        }
        item.attempts += 1;
        if (item.attempts >= this.maxRetries) {
          this.buffer.shift();
        } else {
          await sleep(this.retryDelayMs);
          break;
        }
      }
      return { statusCode: 200 };
    } finally {
      this.sending = false;
    }
  }
}
