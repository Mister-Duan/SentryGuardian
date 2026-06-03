import type { Breadcrumb } from './breadcrumb.js';
import type { StackFrame } from './stack.js';

/** Event severity level. 事件严重级别。 */
export type EventLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

/** SDK platform identifier. SDK 平台标识。 */
export type Platform = 'javascript';

/**
 * SDK metadata embedded in events.
 * 嵌入事件中的 SDK 元数据。
 */
export interface SdkInfo {
  name: string;
  version: string;
}

/**
 * User context on an event.
 * 事件关联的用户上下文。
 */
export interface User {
  id?: string;
  email?: string;
  username?: string;
  ip_address?: string;
}

/**
 * HTTP request context.
 * HTTP 请求上下文。
 */
export interface RequestContext {
  url?: string;
  headers?: Record<string, string>;
}

/**
 * Single exception in the exception chain.
 * 异常链中的单条异常记录。
 */
export interface ExceptionValue {
  type: string;
  value: string;
  stacktrace?: { frames: StackFrame[] };
  mechanism?: { type: string; handled: boolean };
}

/**
 * Error event payload sent by the SDK.
 * SDK 上报的错误事件载荷。
 */
export interface ErrorEvent {
  event_id: string;
  timestamp: string;
  platform: Platform;
  level: EventLevel;
  release?: string;
  environment?: string;
  exception?: { values: ExceptionValue[] };
  message?: string;
  request?: RequestContext;
  user?: User;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  breadcrumbs?: Breadcrumb[];
  sdk: SdkInfo;
  /** Optional custom grouping fingerprint. 可选的自定义聚合指纹。 */
  fingerprint?: string[];
}
