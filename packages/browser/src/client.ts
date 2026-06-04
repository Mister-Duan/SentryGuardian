import { Client, type ClientOptions } from '@sentry-guardian/core';
import type { ErrorEvent, ExceptionValue } from '@sentry-guardian/types';
import { parseStack } from './stack-parser.js';

/**
 * Options for {@link BrowserClient}.
 * {@link BrowserClient} 的配置项。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const options: BrowserClientOptions = {
 *   dsn: 'https://publicKey@localhost/api/demo',
 *   sdk: { name: 'sentry-guardian.javascript.browser', version: '0.1.0' },
 *   linkedErrors: true,
 * };
 * ```
 */
export interface BrowserClientOptions extends ClientOptions {
  /**
   * When false, only the top error is reported (no `Error.cause` chain).
   * 为 false 时仅上报顶层异常（不展开 `Error.cause` 链）。
   */
  linkedErrors?: boolean;
}

/**
 * Browser-specific SDK client with stack parsing and linked errors.
 * 浏览器 SDK Client：解析 `Error.stack` 并可选展开 cause 链后上报。
 *
 * @example
 * ```ts
 * // Input / 输入
 * new BrowserClient({ dsn: 'https://key@host/api/1', sdk: { name: 'x', version: '0.1.0' } })
 * // Output / 输出
 * BrowserClient instance
 * ```
 */
export class BrowserClient extends Client {
  private linkedErrorsEnabled: boolean;

  constructor(options: BrowserClientOptions) {
    super(options);
    this.linkedErrorsEnabled = options.linkedErrors !== false;
  }

  protected override buildErrorEvent(
    error: unknown,
    hint?: { mechanism?: string },
  ): ErrorEvent | null {
    const event = super.buildErrorEvent(error, hint);
    if (!event?.exception?.values?.length) {
      return event;
    }

    const values = this.buildExceptionValues(error, hint?.mechanism);
    if (!values.length) {
      return event;
    }

    return {
      ...event,
      exception: { values },
    };
  }

  private buildExceptionValues(error: unknown, mechanism?: string): ExceptionValue[] {
    const chain: unknown[] = [];
    let current: unknown = error;
    const seen = new Set<unknown>();

    while (current && !seen.has(current)) {
      seen.add(current);
      chain.push(current);
      if (!this.linkedErrorsEnabled || !(current instanceof Error) || !current.cause) {
        break;
      }
      current = current.cause;
    }

    return chain.map((item, index) => exceptionFromItem(item, mechanism, index === 0));
  }
}

function exceptionFromItem(
  error: unknown,
  mechanism: string | undefined,
  handled: boolean,
): ExceptionValue {
  if (error instanceof Error) {
    const value: ExceptionValue = {
      type: error.name || 'Error',
      value: error.message,
      mechanism: { type: mechanism ?? 'generic', handled },
    };
    const frames = parseStack(error.stack);
    if (frames.length > 0) {
      value.stacktrace = { frames };
    }
    return value;
  }

  if (typeof error === 'string') {
    return {
      type: 'Error',
      value: error,
      mechanism: { type: mechanism ?? 'generic', handled },
    };
  }

  return {
    type: 'Error',
    value: String(error),
    mechanism: { type: mechanism ?? 'generic', handled },
  };
}
