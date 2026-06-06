import { afterEach, describe, expect, it } from 'vitest';
import { BufferTransport, MockTransport } from '@sentry-guardian/core';
import { BrowserClient } from '../client.js';
import { globalHandlersIntegration } from './global-handlers.js';

const sdk = { name: 'test.browser', version: '0.1.0' };

describe('globalHandlersIntegration', () => {
  afterEach(() => {
    // jsdom keeps listeners; tests use isolated clients only
  });

  it('skips resource error events (target !== window)', async () => {
    const inner = new MockTransport({ url: 'https://localhost/envelope/' });
    const client = new BrowserClient({
      dsn: 'http://localhost:3001/api/sentry/envelope/demo',
      sdk,
      transport: new BufferTransport(inner),
      integrations: [globalHandlersIntegration()],
    });

    const img = document.createElement('img');
    img.dispatchEvent(new Event('error'));
    await client.flush(100);
    expect(inner.sent).toHaveLength(0);
  });

});
