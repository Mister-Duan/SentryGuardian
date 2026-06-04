import { afterEach, describe, expect, it, vi } from 'vitest';
import { MockTransport, BufferTransport } from '@sentry-guardian/core';
import { init, getClient, close } from './sdk.js';
import { FetchTransport } from './transports/fetch.js';

const dsn = 'https://public@localhost/api/demo';

describe('browser init', () => {
  afterEach(async () => {
    await close(100);
  });

  it('registers default integrations and client', () => {
    const client = init({ dsn, transport: new BufferTransport(new MockTransport({ url: 'x' })) });
    expect(client).toBe(getClient());
    expect(client.getOptions().sdk.name).toBe('sentry-guardian.javascript.browser');
  });

  it('FetchTransport posts serialized envelope', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      headers: { forEach: () => {} },
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = init({
      dsn,
      transport: new BufferTransport(new FetchTransport({ url: 'https://localhost/envelope/' })),
      defaultIntegrations: false,
    });

    client.captureMessage('hello');
    await client.flush(500);

    expect(fetchMock).toHaveBeenCalled();
    const [, initArg] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(initArg.method).toBe('POST');
    expect(String(initArg.body)).toContain('hello');

    vi.restoreAllMocks();
  });
});
