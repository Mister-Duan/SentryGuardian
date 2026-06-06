import { resetFetchCache } from '@sentry-guardian/browser-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserClient } from '../client.js';
import { browserTracingIntegration } from './browser-tracing.js';

describe('browserTracingIntegration', () => {
  const dsn = 'http://localhost:3001/api/sentry/envelope/proj-1';
  const ingestUrl = `${dsn}/`;
  let nativeFetch: typeof fetch;

  beforeEach(() => {
    resetFetchCache();
    nativeFetch = globalThis.fetch;
  });

  afterEach(() => {
    resetFetchCache();
    globalThis.fetch = nativeFetch;
    vi.restoreAllMocks();
  });

  async function runSlowFetch(
    url: string,
    options: Parameters<typeof browserTracingIntegration>[0] = {},
  ) {
    const captureTransaction = vi.fn();
    const client = new BrowserClient({
      dsn,
      ingestUrl,
      sdk: { name: 'test', version: '0.0.0' },
    });
    client.captureTransaction = captureTransaction;

    globalThis.fetch = vi.fn(async () => new Response('ok', { status: 200 })) as typeof fetch;
    resetFetchCache();

    browserTracingIntegration({ slowThresholdMs: 0, ...options }).setup(client);

    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(100);

    await window.fetch(url);
    return captureTransaction;
  }

  it('does not capture slow fetch to ingest URL', async () => {
    const captureTransaction = await runSlowFetch(ingestUrl);
    expect(captureTransaction).not.toHaveBeenCalled();
  });

  it('captures slow fetch to non-ingest URL', async () => {
    const captureTransaction = await runSlowFetch('https://api.example.com/data');
    expect(captureTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction: 'http.client',
        url: 'https://api.example.com/data',
      }),
    );
  });

  it('respects user denyUrls', async () => {
    const captureTransaction = await runSlowFetch('https://analytics.example.com/pixel', {
      denyUrls: [/analytics/],
    });
    expect(captureTransaction).not.toHaveBeenCalled();
  });
});
