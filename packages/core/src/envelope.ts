import type { Envelope, EnvelopeItem, ErrorEvent, TransactionEvent } from '@sentry-guardian/types';

/**
 * Build an envelope containing one or more events.
 * 构建包含一个或多个事件的 Envelope。
 *
 * @example
 * ```ts
 * // Input / 输入
 * createEnvelope([event], { name: 'test', version: '0.1.0' }).items.length
 * // Output / 输出
 * 1
 * ```
 */
export function createEnvelope(
  events: ErrorEvent[],
  sdk: { name: string; version: string },
): Envelope {
  const items: EnvelopeItem[] = events.map((event) => ({
    header: { type: 'event', content_type: 'application/json' },
    payload: event,
  }));

  return {
    header: {
      sdk,
      sent_at: new Date().toISOString(),
    },
    items,
  };
}

/**
 * Build an envelope containing a performance transaction.
 * 构建包含性能事务的 Envelope。
 *
 * @example
 * ```ts
 * // Input / 输入
 * createTransactionEnvelope(tx, sdk).items[0].header.type
 * // Output / 输出
 * 'transaction'
 * ```
 */
export function createTransactionEnvelope(
  transaction: TransactionEvent,
  sdk: { name: string; version: string },
): Envelope {
  return createTransactionsEnvelope([transaction], sdk);
}

/**
 * Build an envelope containing multiple performance transactions (one ingest POST).
 * 构建包含多条性能事务的 Envelope（单次 ingest POST）。
 *
 * @example
 * ```ts
 * // Input / 输入
 * createTransactionsEnvelope([txA, txB], { name: 'test', version: '0.1.0' }).items.length
 * // Output / 输出
 * 2
 * ```
 */
export function createTransactionsEnvelope(
  transactions: TransactionEvent[],
  sdk: { name: string; version: string },
): Envelope {
  const items: EnvelopeItem[] = transactions.map((transaction) => ({
    header: { type: 'transaction', content_type: 'application/json' },
    payload: transaction,
  }));

  return {
    header: {
      sdk,
      sent_at: new Date().toISOString(),
    },
    items,
  };
}

/**
 * Encode envelope to line-based sentry-envelope format.
 * 编码为行式 sentry-envelope 格式。
 *
 * @example
 * ```ts
 * // Input / 输入
 * serializeEnvelope(createEnvelope([event], sdk)).split('\n').length >= 3
 * // Output / 输出
 * true
 * ```
 */
export function serializeEnvelope(envelope: Envelope): string {
  const lines: string[] = [JSON.stringify(envelope.header)];
  for (const item of envelope.items) {
    lines.push(JSON.stringify(item.header));
    lines.push(typeof item.payload === 'string' ? item.payload : JSON.stringify(item.payload));
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Parse line-based sentry-envelope body.
 * 解析行式 sentry-envelope 正文。
 *
 * @example
 * ```ts
 * // Input / 输入
 * parseEnvelope(serializeEnvelope(envelope)).items.length
 * // Output / 输出
 * 1
 * ```
 */
export function parseEnvelope(body: string): {
  header: Record<string, unknown>;
  items: Array<{ header: Record<string, unknown>; payload: string }>;
} {
  const lines = body.split('\n').filter((line) => line.length > 0);
  if (lines.length === 0) {
    throw new Error('Empty envelope');
  }
  const header = JSON.parse(lines[0]!) as Record<string, unknown>;
  const items: Array<{ header: Record<string, unknown>; payload: string }> = [];
  for (let i = 1; i < lines.length; ) {
    const itemHeader = JSON.parse(lines[i]!) as Record<string, unknown>;
    i += 1;
    items.push({ header: itemHeader, payload: lines[i] ?? '' });
    i += 1;
  }
  return { header, items };
}
