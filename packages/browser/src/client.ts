import { Client, type CaptureHint, type ClientOptions } from '@sentry-guardian/core';
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
 *   dsn: 'http://localhost:3001/api/sentry/envelope/demo',
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
 * new BrowserClient({ dsn: 'http://localhost:3001/api/sentry/envelope/1', sdk: { name: 'x', version: '0.1.0' } })
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

  protected override buildErrorEvent(error: unknown, hint?: CaptureHint): ErrorEvent | null {
    const event = super.buildErrorEvent(error, hint);
    if (!event?.exception?.values?.length) {
      return event;
    }

    const values = this.buildExceptionValues(error, hint?.mechanism);
    if (!values.length) {
      return event;
    }

    const withSynthetic = this.applySyntheticLocation(values, hint?.syntheticLocation);

    return {
      ...event,
      exception: { values: withSynthetic },
    };
  }

  private applySyntheticLocation(
    values: ExceptionValue[],
    location?: CaptureHint['syntheticLocation'],
  ): ExceptionValue[] {
    if (!location?.filename || values.length === 0) {
      return values;
    }
    const head = values[0]!;
    if (head.stacktrace?.frames?.length) {
      return values;
    }
    return [
      {
        ...head,
        stacktrace: {
          frames: [
            {
              filename: location.filename,
              lineno: location.lineno,
              colno: location.colno,
              in_app: true,
            },
          ],
        },
      },
      ...values.slice(1),
    ];
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
