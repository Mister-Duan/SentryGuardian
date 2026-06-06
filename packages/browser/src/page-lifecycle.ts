import type { Client } from '@sentry-guardian/core';

/**
 * Drain buffered envelopes on page hide via `sendBeacon` when supported.
 * 页面隐藏时通过 `sendBeacon`（若可用）排空缓冲 Envelope。
 */
export function registerPageLifecycleFlush(client: Client): void {
  if (typeof window === 'undefined') {
    return;
  }

  const drain = () => {
    setTimeout(() => client.flushSync(), 0);
  };

  window.addEventListener('pagehide', drain);
}
