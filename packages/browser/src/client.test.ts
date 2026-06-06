import { describe, expect, it } from 'vitest';
import { MockTransport, BufferTransport } from '@sentry-guardian/core';
import { BrowserClient } from './client.js';

const sdk = { name: 'test.browser', version: '0.1.0' };

describe('BrowserClient', () => {
  it('attaches stack frames from Error', async () => {
    const inner = new MockTransport({ url: 'https://localhost/envelope/' });
    const client = new BrowserClient({
      dsn: 'http://localhost:3001/api/sentry/envelope/demo',
      sdk,
      transport: new BufferTransport(inner),
      integrations: [],
    });

    const error = new Error('stack test');
    error.stack = ['Error: stack test', '    at fn (app.js:2:3)'].join('\n');
    const id = client.captureException(error);
    expect(id).toBeDefined();
    await client.flush(500);

    const payload = inner.sent[0]!.items[0]!.payload as {
      exception: { values: { stacktrace?: { frames: { filename?: string }[] } }[] };
    };
    const frames = payload.exception.values[0]!.stacktrace?.frames ?? [];
    expect(frames.some((f) => f.filename === 'app.js')).toBe(true);
  });

  it('adds synthetic stack frame from capture hint', async () => {
    const inner = new MockTransport({ url: 'https://localhost/envelope/' });
    const client = new BrowserClient({
      dsn: 'http://localhost:3001/api/sentry/envelope/demo',
      sdk,
      transport: new BufferTransport(inner),
      integrations: [],
    });

    client.captureException('Script error.', {
      mechanism: 'onerror',
      syntheticLocation: { filename: 'https://app.example/main.js', lineno: 10, colno: 4 },
    });
    await client.flush(500);

    const payload = inner.sent[0]!.items[0]!.payload as {
      exception: { values: { stacktrace?: { frames: { filename?: string }[] } }[] };
    };
    const frames = payload.exception.values[0]!.stacktrace?.frames ?? [];
    expect(frames.some((f) => f.filename?.includes('main.js'))).toBe(true);
  });

  it('includes linked Error.cause chain', async () => {
    const inner = new MockTransport({ url: 'https://localhost/envelope/' });
    const client = new BrowserClient({
      dsn: 'http://localhost:3001/api/sentry/envelope/demo',
      sdk,
      transport: new BufferTransport(inner),
      integrations: [],
      linkedErrors: true,
    });

    const root = new Error('root');
    const wrapped = new Error('wrapped', { cause: root });
    client.captureException(wrapped);
    await client.flush(500);

    const payload = inner.sent[0]!.items[0]!.payload as {
      exception: { values: { value: string }[] };
    };
    expect(payload.exception.values).toHaveLength(2);
    expect(payload.exception.values[0]!.value).toBe('wrapped');
    expect(payload.exception.values[1]!.value).toBe('root');
  });
});
