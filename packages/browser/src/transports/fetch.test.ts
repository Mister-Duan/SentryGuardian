import { createEnvelope } from '@sentry-guardian/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FetchTransport } from './fetch.js';

const envelope = createEnvelope(
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

describe('FetchTransport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sendSync posts via sendBeacon with envelope content type', () => {
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal('navigator', { sendBeacon });

    const transport = new FetchTransport({ url: 'https://host/api/sentry/envelope/demo/' });
    const ok = transport.sendSync(envelope);

    expect(ok).toBe(true);
    expect(sendBeacon).toHaveBeenCalledTimes(1);
    const [, blob] = sendBeacon.mock.calls[0] as [string, Blob];
    expect(blob.type).toBe('application/x-sentry-guardian-envelope');
  });

  it('sendSync returns false when sendBeacon is unavailable', () => {
    vi.stubGlobal('navigator', {});

    const transport = new FetchTransport({ url: 'https://host/api/sentry/envelope/demo/' });
    expect(transport.sendSync(envelope)).toBe(false);
  });
});
