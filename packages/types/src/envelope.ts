/**
 * Envelope item types supported by SentryGuardian ingest.
 * SentryGuardian ingest 支持的 Envelope 条目类型。
 *
 * - `event` — ErrorEvent payload. 错误事件载荷。
 * - `session` — reserved for future session replay. 预留会话类型。
 * - `client_report` — SDK self-telemetry. SDK 自监控报告。
 * - `attachment` — binary attachment. 二进制附件。
 */
export type EnvelopeItemType =
  | 'event'
  | 'transaction'
  | 'session'
  | 'client_report'
  | 'attachment';

/**
 * Top-level envelope metadata (first JSON line of the wire format).
 * Envelope 顶层元数据（线协议首行 JSON）。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const header: EnvelopeHeader = {
 *   sdk: { name: 'sentry-guardian.javascript.browser', version: '0.1.0' },
 *   sent_at: '2026-06-03T12:00:00.000Z',
 * };
 * ```
 */
export interface EnvelopeHeader {
  /** SDK that constructed this envelope. 构造本 Envelope 的 SDK 信息。 */
  sdk?: SdkInfoRef;
  /** ISO 8601 time when the envelope was sent. Envelope 发送时间的 ISO 8601 字符串。 */
  sent_at?: string;
  /** Optional DSN string for routing (usually omitted when URL embeds project). 可选 DSN 字符串（通常 URL 已含项目时省略）。 */
  dsn?: string;
}

/**
 * SDK name and version reference in envelope header.
 * Envelope 头中的 SDK 名称与版本引用。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const sdk: SdkInfoRef = { name: 'sentry-guardian.javascript.browser', version: '0.1.0' };
 * ```
 */
export interface SdkInfoRef {
  /** SDK package identifier. SDK 包标识。 */
  name: string;
  /** SDK release version. SDK 发布版本。 */
  version: string;
}

/**
 * Per-item header (JSON line immediately before the item payload line).
 * 每个条目的头（位于 payload 行之前的 JSON 行）。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const itemHeader: EnvelopeItemHeader = {
 *   type: 'event',
 *   content_type: 'application/json',
 * };
 * ```
 */
export interface EnvelopeItemHeader {
  /** Discriminator for how to decode the following payload line. 下一行 payload 的解码类型标识。 */
  type: EnvelopeItemType;
  /** Byte length of payload when precomputed (optional). 预计算的 payload 字节长度（可选）。 */
  length?: number;
  /** MIME type of the payload body. payload 体的 MIME 类型。 */
  content_type?: string;
}

/**
 * Typed envelope item pairing header metadata with a decoded payload.
 * 带类型的 Envelope 条目：头元数据 + 已解码 payload。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const item: EnvelopeItem = {
 *   header: { type: 'event', content_type: 'application/json' },
 *   payload: errorEvent,
 * };
 * ```
 */
export interface EnvelopeItem<T = unknown> {
  /** Item-level header. 条目级头。 */
  header: EnvelopeItemHeader;
  /** Parsed or raw payload object/string. 已解析或原始的 payload 对象/字符串。 */
  payload: T;
}

/**
 * Full envelope ready for {@link serializeEnvelope} or transport send.
 * 可供 {@link serializeEnvelope} 或 Transport 发送的完整 Envelope。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const envelope: Envelope = { header: { sent_at: '...' }, items: [] };
 * ```
 */
export interface Envelope {
  /** Top-level metadata line. 顶层元数据行。 */
  header: EnvelopeHeader;
  /** Ordered list of items (typically one `event` in MVP). 有序条目列表（MVP 通常仅一条 `event`）。 */
  items: EnvelopeItem[];
}

/**
 * Parsed line-based envelope where payloads remain raw strings.
 * 解析后的行式 Envelope（payload 仍为原始字符串）。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const parsed: ParsedEnvelope = {
 *   header: {},
 *   items: [{ header: { type: 'event' }, payload: '{"event_id":"..."}' }],
 * };
 * ```
 */
export interface ParsedEnvelope {
  /** Parsed envelope header object. 解析后的 Envelope 头对象。 */
  header: EnvelopeHeader;
  /** Items with string payloads before JSON parse. JSON 解析前的字符串 payload 条目。 */
  items: Array<{ header: EnvelopeItemHeader; payload: string }>;
}
