import type { ErrorEvent, ExceptionValue, SdkInfo, User } from '@sentry-guardian/types';
import { normalizeTimestamp } from '@sentry-guardian/utils/string';
import { generateEventId, parseDsn } from './dsn.js';
import { createEnvelope } from './envelope.js';
import { EventProcessor, type BeforeSendFn } from './event-processor.js';
import { setupIntegrations, type Integration } from './integration.js';
import { ScopeStack } from './scope.js';
import { BufferTransport } from './transports/buffer.js';
import { MockTransport, type Transport } from './transports/base.js';

const DEDUPE_WINDOW_MS = 2000;

/**
 * Client configuration options.
 * Client 配置项。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const options: ClientOptions = {
 *   dsn: 'http://localhost:3001/api/sentry/demo',
 *   environment: 'production',
 *   sampleRate: 1,
 *   sdk: { name: 'sentry-guardian.javascript', version: '0.1.0' },
 * };
 * ```
 */
export interface ClientOptions {
  /** Ingest DSN for this project. 本项目的 ingest DSN。 */
  dsn: string;
  /** Deployment environment tag on events. 事件上的部署环境标签。 */
  environment?: string;
  /** Release version tag on events. 事件上的发布版本标签。 */
  release?: string;
  /** Fraction of events to send (`0`–`1`); default `1`. 发送采样比例（`0`–`1`），默认 `1`。 */
  sampleRate?: number;
  /** When true, include email/IP in user context. 为 true 时在用户上下文中包含邮箱/IP。 */
  sendDefaultPii?: boolean;
  /** Max breadcrumbs kept on scope before oldest are dropped. Scope 保留的面包屑上限，超出则丢弃最旧。 */
  maxBreadcrumbs?: number;
  /** Message substrings or regexes that drop matching errors. 匹配则丢弃异常的消息子串或正则。 */
  ignoreErrors?: Array<string | RegExp>;
  /** Hook to mutate or drop events before send. 发送前修改或丢弃事件的钩子。 */
  beforeSend?: BeforeSendFn;
  /** Transport used to POST envelopes to ingest. 向 ingest POST Envelope 的 Transport。 */
  transport?: Transport;
  /** Integrations run at client construction. Client 构造时运行的集成列表。 */
  integrations?: Integration[];
  /** Reporting SDK metadata (required). 上报 SDK 元数据（必填）。 */
  sdk: SdkInfo;
}

/**
 * SDK core client: capture, process, and send events.
 * SDK 核心 Client：采集、处理并发送事件。
 */
export class Client {
  protected options: ClientOptions;
  protected scopeStack = new ScopeStack();
  protected eventProcessor = new EventProcessor();
  protected transport: Transport;
  private closed = false;
  private lastDedupeKey = '';
  private lastDedupeTime = 0;

  constructor(options: ClientOptions) {
    this.options = {
      environment: 'production',
      sampleRate: 1,
      sendDefaultPii: false,
      maxBreadcrumbs: 100,
      ...options,
    };

    this.scopeStack.get().maxBreadcrumbs = this.options.maxBreadcrumbs ?? 100;

    if (options.beforeSend) {
      this.eventProcessor.add(options.beforeSend);
    }

    if (options.transport) {
      this.transport = options.transport;
    } else {
      const { envelopeUrl } = parseDsn(options.dsn);
      this.transport = new BufferTransport(new MockTransport({ url: envelopeUrl }));
    }

    const integrations = options.integrations ?? [];
    setupIntegrations(this, integrations);
  }

  /** Return frozen client configuration. 返回 Client 配置（只读视图）。 */
  getOptions(): Readonly<ClientOptions> {
    return this.options;
  }

  /** Return the scope stack for context mutations. 返回用于修改上下文的 Scope 栈。 */
  getScope(): ScopeStack {
    return this.scopeStack;
  }

  /** Return the active transport (may be buffered). 返回当前 Transport（可能为缓冲包装）。 */
  getTransport(): Transport {
    return this.transport;
  }

  /**
   * Register a beforeSend processor (e.g. from an integration).
   * 注册 beforeSend 处理器（如由集成调用）。
   *
   * @example
   * ```ts
   * // Input / 输入
   * client.addBeforeSend((e) => e)
   * // Output / 输出
   * undefined
   * ```
   */
  addBeforeSend(processor: BeforeSendFn): void {
    this.eventProcessor.add(processor);
  }

  /**
   * Capture an exception and queue it for send.
   * 捕获异常并加入发送队列。
   *
   * @example
   * ```ts
   * // Input / 输入
   * client.captureException(new Error('boom'))
   * // Output / 输出（UUID 字符串或 undefined 若采样/去重丢弃）
   * 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
   * ```
   */
  captureException(error: unknown, hint?: { mechanism?: string }): string | undefined {
    if (this.closed || !this.shouldSample()) {
      return undefined;
    }

    const event = this.buildErrorEvent(error, hint);
    if (!event || this.isDuplicate(event)) {
      return undefined;
    }

    const processed = this.eventProcessor.process(event);
    if (!processed) {
      return undefined;
    }

    void this.sendEvent(processed);
    return processed.event_id;
  }

  /**
   * Capture a message event.
   * 捕获消息事件。
   *
   * @example
   * ```ts
   * // Input / 输入
   * client.captureMessage('hello', 'info')
   * // Output / 输出
   * 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
   * ```
   */
  captureMessage(message: string, level: ErrorEvent['level'] = 'info'): string | undefined {
    if (this.closed || !this.shouldSample()) {
      return undefined;
    }
    const scope = this.scopeStack.get();
    const event: ErrorEvent = {
      event_id: generateEventId(),
      timestamp: normalizeTimestamp(),
      platform: 'javascript',
      level,
      message,
      environment: this.options.environment,
      release: this.options.release,
      user: this.applyPii(scope.getUser()),
      tags: scope.getTags(),
      extra: scope.getExtra(),
      breadcrumbs: scope.getBreadcrumbs(),
      sdk: this.options.sdk,
    };

    const processed = this.eventProcessor.process(event);
    if (!processed) {
      return undefined;
    }

    void this.sendEvent(processed);
    return processed.event_id;
  }

  /**
   * Flush pending envelopes within timeout.
   * 在超时时间内 flush 待发送 Envelope。
   *
   * @example
   * ```ts
   * // Input / 输入
   * await client.flush(1000)
   * // Output / 输出
   * true
   * ```
   */
  async flush(timeout = 2000): Promise<boolean> {
    return (await this.transport.flush?.(timeout)) ?? true;
  }

  /**
   * Close client and flush remaining events.
   * 关闭 Client 并 flush 剩余事件。
   *
   * @example
   * ```ts
   * // Input / 输入
   * await client.close(1000)
   * // Output / 输出
   * true
   * ```
   */
  async close(timeout = 2000): Promise<boolean> {
    this.closed = true;
    return (await this.transport.close?.(timeout)) ?? true;
  }

  protected buildErrorEvent(
    error: unknown,
    hint?: { mechanism?: string },
  ): ErrorEvent | null {
    const scope = this.scopeStack.get();
    const exception = exceptionFromUnknown(error, hint?.mechanism);
    if (!exception) {
      return null;
    }

    if (this.matchesIgnoreErrors(exception.value)) {
      return null;
    }

    return {
      event_id: generateEventId(),
      timestamp: normalizeTimestamp(),
      platform: 'javascript',
      level: 'error',
      environment: this.options.environment,
      release: this.options.release,
      exception: { values: [exception] },
      user: this.applyPii(scope.getUser()),
      tags: scope.getTags(),
      extra: scope.getExtra(),
      breadcrumbs: scope.getBreadcrumbs(),
      sdk: this.options.sdk,
    };
  }

  protected async sendEvent(event: ErrorEvent): Promise<void> {
    const envelope = createEnvelope([event], this.options.sdk);
    await this.transport.send(envelope);
  }

  private shouldSample(): boolean {
    const rate = this.options.sampleRate ?? 1;
    return Math.random() < rate;
  }

  private isDuplicate(event: ErrorEvent): boolean {
    const ex = event.exception?.values[0];
    if (!ex) {
      return false;
    }
    const key = `${ex.type}|${ex.value}`;
    const now = Date.now();
    if (key === this.lastDedupeKey && now - this.lastDedupeTime < DEDUPE_WINDOW_MS) {
      return true;
    }
    this.lastDedupeKey = key;
    this.lastDedupeTime = now;
    return false;
  }

  private matchesIgnoreErrors(message: string): boolean {
    const patterns = this.options.ignoreErrors ?? [];
    return patterns.some((pattern) =>
      typeof pattern === 'string' ? message.includes(pattern) : pattern.test(message),
    );
  }

  private applyPii(user?: User): User | undefined {
    if (!user) {
      return undefined;
    }
    if (this.options.sendDefaultPii) {
      return user;
    }
    return user.id ? { id: user.id } : undefined;
  }
}

function exceptionFromUnknown(error: unknown, mechanism?: string): ExceptionValue | null {
  if (error instanceof Error) {
    return {
      type: error.name || 'Error',
      value: error.message,
      mechanism: { type: mechanism ?? 'generic', handled: false },
    };
  }
  if (typeof error === 'string') {
    return {
      type: 'Error',
      value: error,
      mechanism: { type: mechanism ?? 'generic', handled: false },
    };
  }
  return {
    type: 'Error',
    value: String(error),
    mechanism: { type: mechanism ?? 'generic', handled: false },
  };
}
