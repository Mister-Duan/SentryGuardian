import { BufferTransport, parseDsn } from '@sentry-guardian/core';
import { BrowserClient, type BrowserClientOptions } from './client.js';
import { getDefaultIntegrations } from './default-integrations.js';
import { FetchTransport } from './transports/fetch.js';

let activeClient: BrowserClient | undefined;

const SDK_VERSION = '0.1.0';

/**
 * Options for {@link init} in the browser SDK.
 * 浏览器 SDK {@link init} 的配置项。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const options: BrowserInitOptions = {
 *   dsn: 'http://localhost:3001/api/sentry/demo',
 *   environment: 'production',
 *   denyUrls: [/extensions\//],
 * };
 * ```
 */
export interface BrowserInitOptions
  extends Omit<BrowserClientOptions, 'sdk' | 'transport' | 'integrations'> {
  /** Ingest DSN for this project. 本项目的 ingest DSN。 */
  dsn: string;
  /** Drop events whose `request.url` matches any pattern. 丢弃 URL 匹配任一模式的事件。 */
  denyUrls?: Array<string | RegExp>;
  /** Allow only events whose `request.url` matches a pattern (if non-empty). 仅保留 URL 匹配任一模式的事件（非空时生效）。 */
  allowUrls?: Array<string | RegExp>;
  /** Extra integrations appended after defaults (deduped by name). 在默认集成之后追加的集成（按 name 去重）。 */
  integrations?: BrowserClientOptions['integrations'];
  /**
   * When false, skip P0 default integrations.
   * 为 false 时不加载 P0 默认集成。
   */
  defaultIntegrations?: boolean;
  /** Same-origin tunnel URL for ingest (bypasses ad-block). 同源 tunnel URL（绕过广告拦截）。 */
  tunnel?: string;
  /** Custom transport; defaults to buffered Fetch to ingest. 自定义 Transport。 */
  transport?: BrowserClientOptions['transport'];
}

/**
 * Initialize the browser SDK with fetch transport and default integrations.
 * 使用 Fetch Transport 与默认集成初始化浏览器 SDK。
 *
 * @example
 * ```ts
 * // Input / 输入
 * init({ dsn: 'http://localhost:3001/api/sentry/proj_1' })
 * // Output / 输出
 * BrowserClient
 * ```
 */
export function init(options: BrowserInitOptions): BrowserClient {
  const {
    dsn,
    denyUrls,
    allowUrls,
    defaultIntegrations,
    integrations: customIntegrations,
    transport: customTransport,
    tunnel,
    ...clientOptions
  } = options;

  const { envelopeUrl } = parseDsn(dsn);
  const targetUrl = tunnel ?? envelopeUrl;
  const integrations =
    defaultIntegrations === false
      ? (customIntegrations ?? [])
      : getDefaultIntegrations({
          denyUrls,
          allowUrls,
          integrations: customIntegrations,
        });

  const transport =
    customTransport ??
    new BufferTransport(
      new FetchTransport({
        url: targetUrl,
      }),
    );

  const client = new BrowserClient({
    ...clientOptions,
    dsn,
    sdk: {
      name: 'sentry-guardian.javascript.browser',
      version: SDK_VERSION,
    },
    transport,
    integrations,
  });

  activeClient = client;
  return client;
}

/**
 * Get the active browser client.
 * 获取当前活跃的 BrowserClient。
 *
 * @example
 * ```ts
 * // Input / 输入
 * getClient()
 * // Output / 输出
 * BrowserClient | undefined
 * ```
 */
export function getClient(): BrowserClient | undefined {
  return activeClient;
}

/**
 * Capture an exception on the active client.
 * 在活跃 Client 上捕获异常。
 *
 * @example
 * ```ts
 * // Input / 输入
 * captureException(new Error('boom'))
 * // Output / 输出（event_id 或 undefined）
 * 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
 * ```
 */
export function captureException(error: unknown): string | undefined {
  return activeClient?.captureException(error);
}

/**
 * Capture a message on the active client.
 * 在活跃 Client 上捕获消息。
 *
 * @example
 * ```ts
 * // Input / 输入
 * captureMessage('hello', 'info')
 * // Output / 输出
 * 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
 * ```
 */
export function captureMessage(
  message: string,
  level?: import('@sentry-guardian/types').EventLevel,
): string | undefined {
  return activeClient?.captureMessage(message, level);
}

/**
 * Flush pending envelopes on the active client.
 * Flush 活跃 Client 的待发送 Envelope。
 *
 * @example
 * ```ts
 * // Input / 输入
 * await flush(2000)
 * // Output / 输出
 * true
 * ```
 */
export async function flush(timeout?: number): Promise<boolean> {
  return (await activeClient?.flush(timeout)) ?? true;
}

/**
 * Close the active client and flush remaining events.
 * 关闭活跃 Client 并 flush 剩余事件。
 *
 * @example
 * ```ts
 * // Input / 输入
 * await close(2000)
 * // Output / 输出
 * true
 * ```
 */
export async function close(timeout?: number): Promise<boolean> {
  const result = (await activeClient?.close(timeout)) ?? true;
  activeClient = undefined;
  return result;
}
