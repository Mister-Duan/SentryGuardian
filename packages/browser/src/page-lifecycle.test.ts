import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Client, MockTransport } from '@sentry-guardian/core';
import { registerPageLifecycleFlush } from './page-lifecycle.js';

const dsn = 'http://localhost:3001/api/sentry/envelope/demo';
const sdk = { name: 'test.browser', version: '0.1.0' };

describe('registerPageLifecycleFlush', () => {
  let pagehideHandler: (() => void) | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    pagehideHandler = undefined;
    vi.spyOn(window, 'addEventListener').mockImplementation((event, listener) => {
      if (event === 'pagehide') {
        pagehideHandler = listener as () => void;
      }
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('calls client.flushSync on pagehide', () => {
    const inner = new MockTransport({ url: `${dsn}/` });
    const client = new Client({ dsn, sdk, transport: inner });
    const flushSync = vi.spyOn(client, 'flushSync');

    registerPageLifecycleFlush(client);
    expect(pagehideHandler).toBeDefined();

    pagehideHandler?.();
    vi.advanceTimersByTime(0);

    expect(flushSync).toHaveBeenCalledTimes(1);
  });
});
