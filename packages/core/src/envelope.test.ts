import { describe, expect, it } from 'vitest';
import type { TransactionEvent } from '@sentry-guardian/types';
import { createEnvelope, createTransactionsEnvelope, parseEnvelope, serializeEnvelope } from './envelope.js';

const sampleEvent = {
  event_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  timestamp: '2026-06-03T12:00:00.000Z',
  platform: 'javascript' as const,
  level: 'error' as const,
  sdk: { name: 'test', version: '0.1.0' },
};

describe('envelope', () => {
  it('round-trips line-based format', () => {
    const envelope = createEnvelope([sampleEvent], { name: 'test', version: '0.1.0' });
    const serialized = serializeEnvelope(envelope);
    const parsed = parseEnvelope(serialized);
    expect(parsed.items).toHaveLength(1);
    expect(JSON.parse(parsed.items[0]!.payload).event_id).toBe(sampleEvent.event_id);
  });

  it('round-trips multi-transaction envelope', () => {
    const sdk = { name: 'test', version: '0.1.0' };
    const txs: TransactionEvent[] = [
      {
        event_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        timestamp: '2026-06-03T12:00:00.000Z',
        type: 'transaction',
        transaction: 'time-to-first-byte',
        duration_ms: 100,
        metric: 'TTFB',
        metric_value: 100,
        sdk,
      },
      {
        event_id: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
        timestamp: '2026-06-03T12:00:01.000Z',
        type: 'transaction',
        transaction: 'first-contentful-paint',
        duration_ms: 200,
        metric: 'FCP',
        metric_value: 200,
        sdk,
      },
    ];
    const envelope = createTransactionsEnvelope(txs, sdk);
    expect(envelope.items).toHaveLength(2);
    expect(envelope.items[0]!.header.type).toBe('transaction');

    const parsed = parseEnvelope(serializeEnvelope(envelope));
    expect(parsed.items).toHaveLength(2);
    expect(JSON.parse(parsed.items[0]!.payload).metric).toBe('TTFB');
    expect(JSON.parse(parsed.items[1]!.payload).metric).toBe('FCP');
  });
});
