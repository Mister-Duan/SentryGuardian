import { describe, expect, it, vi } from 'vitest';
import { Client } from './client.js';
import type { Transport } from './transports/base.js';
import { MockTransport } from './transports/base.js';
import { BufferTransport } from './transports/buffer.js';

const dsn = 'http://localhost:3001/api/sentry/envelope/demo';
const sdk = { name: 'test.core', version: '0.1.0' };

function createTestClient(overrides: Partial<ConstructorParameters<typeof Client>[0]> = {}) {
  const inner = new MockTransport({ url: 'https://localhost/envelope/' });
  const transport = new BufferTransport(inner);
  const client = new Client({
    dsn,
    sdk,
    transport,
    sampleRate: 1,
    ...overrides,
  });
  return { client, inner, transport };
}

describe('Client', () => {
  it('captureException sends envelope', async () => {
    const { client, inner } = createTestClient();
    const id = client.captureException(new Error('test'));
    expect(id).toBeDefined();
    await client.flush(500);
    expect(inner.sent).toHaveLength(1);
    const payload = inner.sent[0]!.items[0]!.payload as { exception: { values: { value: string }[] } };
    expect(payload.exception.values[0]!.value).toBe('test');
  });

  it('beforeSend can drop event', async () => {
    const { client, inner } = createTestClient({
      beforeSend: (event) => (event.message === 'drop' ? null : event),
    });
    client.captureMessage('drop');
    client.captureMessage('keep');
    await client.flush(500);
    expect(inner.sent).toHaveLength(1);
  });

  it('ignoreErrors filters matching messages', async () => {
    const { client, inner } = createTestClient({ ignoreErrors: ['ignore-me'] });
    client.captureException(new Error('please ignore-me here'));
    await client.flush(500);
    expect(inner.sent).toHaveLength(0);
  });

  it('dedupes identical errors within window', async () => {
    const { client, inner } = createTestClient();
    client.captureException(new Error('dup'));
    client.captureException(new Error('dup'));
    await client.flush(500);
    expect(inner.sent).toHaveLength(1);
  });

  it('sampleRate zero drops all events', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { client } = createTestClient({ sampleRate: 0 });
    expect(client.captureException(new Error('x'))).toBeUndefined();
    vi.restoreAllMocks();
  });

  it('captureTransactions sends one envelope with multiple items', async () => {
    const { client, inner } = createTestClient();
    client.captureTransactions([
      { transaction: 'time-to-first-byte', duration_ms: 100, metric: 'TTFB', metric_value: 100 },
      { transaction: 'first-contentful-paint', duration_ms: 200, metric: 'FCP', metric_value: 200 },
    ]);
    await client.flush(500);
    expect(inner.sent).toHaveLength(1);
    expect(inner.sent[0]!.items).toHaveLength(2);
  });

  it('captureTransactionsSync uses transport sendSync without buffering', () => {
    let syncCalls = 0;
    const inner: Transport = {
      async send() {
        return { statusCode: 200 };
      },
      sendSync() {
        syncCalls += 1;
        return true;
      },
    };
    const transport = new BufferTransport(inner);
    const client = new Client({ dsn, sdk, transport });
    client.captureTransactionsSync([
      { transaction: 'largest-contentful-paint', duration_ms: 1200, metric: 'LCP', metric_value: 1200 },
    ]);
    expect(syncCalls).toBe(1);
    expect(transport.getPendingCount()).toBe(0);
  });

  it('captureTransactionsSync falls back to async send when sendSync fails', async () => {
    const inner: Transport = {
      async send() {
        return { statusCode: 200 };
      },
      sendSync() {
        return false;
      },
    };
    const transport = new BufferTransport(inner);
    const client = new Client({ dsn, sdk, transport });
    client.captureTransactionsSync([
      { transaction: 'largest-contentful-paint', duration_ms: 1200, metric: 'LCP', metric_value: 1200 },
    ]);
    expect(transport.getPendingCount()).toBe(1);
    await client.flush(500);
    expect(transport.getPendingCount()).toBe(0);
  });
});
