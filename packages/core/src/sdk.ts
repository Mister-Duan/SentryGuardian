import { Client, type ClientOptions } from './client.js';

let activeClient: Client | undefined;

/**
 * Options for {@link init} in the core SDK.
 * 核心 SDK {@link init} 的配置项。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const options: InitOptions = {
 *   dsn: 'http://localhost:3001/api/sentry/envelope/demo',
 *   sdkName: 'my-app',
 *   sdkVersion: '1.0.0',
 * };
 * ```
 */
export interface InitOptions extends Omit<ClientOptions, 'sdk'> {
  /** Override default SDK name in events. 覆盖事件中默认的 SDK 名称。 */
  sdkName?: string;
  /** Override default SDK version in events. 覆盖事件中默认的 SDK 版本。 */
  sdkVersion?: string;
}

/**
 * Initialize the global SDK client.
 * 初始化全局 SDK Client。
 *
 * @example
 * ```ts
 * // Input / 输入
 * init({ dsn: 'http://localhost:3001/api/sentry/envelope/proj_1', sdkName: 'test', sdkVersion: '0.1.0' })
 * // Output / 输出
 * Client instance
 * ```
 */
export function init(options: InitOptions): Client {
  const client = new Client({
    ...options,
    sdk: {
      name: options.sdkName ?? 'sentry-guardian.javascript',
      version: options.sdkVersion ?? '0.1.0',
    },
  });
  activeClient = client;
  return client;
}

/**
 * Get the active client, if any.
 * 获取当前活跃的 Client（若有）。
 *
 * @example
 * ```ts
 * // Input / 输入
 * getClient()
 * // Output / 输出
 * Client | undefined
 * ```
 */
export function getClient(): Client | undefined {
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
export function captureMessage(message: string, level?: import('@sentry-guardian/types').EventLevel): string | undefined {
  return activeClient?.captureMessage(message, level);
}

/**
 * Flush the active client transport.
 * Flush 活跃 Client 的 Transport。
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
 * Close the active client.
 * 关闭活跃 Client。
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

export { Client, type ClientOptions };
