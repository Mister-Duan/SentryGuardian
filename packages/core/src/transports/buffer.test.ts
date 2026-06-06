import { describe, expect, it } from 'vitest';
import type { Envelope } from '@sentry-guardian/types';
import type { Transport } from './base.js';
import { StatusTransport } from './base.js';
import { BufferTransport } from './buffer.js';
import { createEnvelope } from '../envelope.js';

const envelope: Envelope = createEnvelope(
  [
    {
      event_id: 'id',
      timestamp: '2026-06-03T12:00:00.000Z',
      platform: 'javascript',
      level: 'error',
      sdk: { name: 't', version: '0' },
    },
  ],
  { name: 't', version: '0' },
);

describe('BufferTransport', () => {
  it('retries on 429 until max retries', async () => {
    let calls = 0;
    const inner: Transport = {
      async send() {
        calls += 1;
        return { statusCode: 429, headers: { 'retry-after': '0' } };
      },
    };
    const buf = new BufferTransport(inner, 2, 1);
    await buf.send(envelope);
    await buf.flush(500);
    expect(calls).toBeGreaterThanOrEqual(2);
  });

  it('clears buffer on 200', async () => {
    const inner = new StatusTransport(200);
    const buf = new BufferTransport(inner);
    await buf.send(envelope);
    await buf.flush(100);
    expect(buf.getPendingCount()).toBe(0);
  });

  it('clears buffer on 201 Created from ingest', async () => {
    const inner = new StatusTransport(201);
    const buf = new BufferTransport(inner);
    await buf.send(envelope);
    await buf.flush(100);
    expect(buf.getPendingCount()).toBe(0);
  });

  it('clears buffer on 204 No Content', async () => {
    const inner = new StatusTransport(204);
    const buf = new BufferTransport(inner);
    await buf.send(envelope);
    await buf.flush(100);
    expect(buf.getPendingCount()).toBe(0);
  });

  it('flushSync drains buffer when inner sendSync succeeds', () => {
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
    const buf = new BufferTransport(inner);
    void buf.send(envelope);
    expect(buf.getPendingCount()).toBe(1);
    buf.flushSync();
    expect(buf.getPendingCount()).toBe(0);
    expect(syncCalls).toBe(1);
  });
});
