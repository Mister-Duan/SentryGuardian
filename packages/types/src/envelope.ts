/** Envelope item types supported by SentryGuardian. SentryGuardian 支持的 Envelope 条目类型。 */
export type EnvelopeItemType = 'event' | 'session' | 'client_report' | 'attachment';

/**
 * Top-level envelope metadata (first line).
 * Envelope 顶层元数据（首行 JSON）。
 */
export interface EnvelopeHeader {
  sdk?: SdkInfoRef;
  sent_at?: string;
  dsn?: string;
}

/**
 * SDK name and version in envelope header.
 * Envelope 头中的 SDK 名称与版本。
 */
export interface SdkInfoRef {
  name: string;
  version: string;
}

/**
 * Per-item header (before payload line).
 * 每个条目的头（位于 payload 行之前）。
 */
export interface EnvelopeItemHeader {
  type: EnvelopeItemType;
  length?: number;
  content_type?: string;
}

/**
 * Typed envelope item.
 * 带类型的 Envelope 条目。
 */
export interface EnvelopeItem<T = unknown> {
  header: EnvelopeItemHeader;
  payload: T;
}

/**
 * Full envelope with header and items.
 * 包含头与条目的完整 Envelope。
 */
export interface Envelope {
  header: EnvelopeHeader;
  items: EnvelopeItem[];
}

/**
 * Parsed line-based envelope (payloads as raw strings).
 * 解析后的行式 Envelope（payload 为原始字符串）。
 */
export interface ParsedEnvelope {
  header: EnvelopeHeader;
  items: Array<{ header: EnvelopeItemHeader; payload: string }>;
}
