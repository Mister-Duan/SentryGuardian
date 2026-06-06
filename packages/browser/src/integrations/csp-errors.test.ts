import { afterEach, describe, expect, it, vi } from 'vitest';
import { BufferTransport, MockTransport } from '@sentry-guardian/core';
import { BrowserClient } from '../client.js';
import { cspErrorsIntegration } from './csp-errors.js';

const sdk = { name: 'test.browser', version: '0.1.0' };

function dispatchCspViolation(target: EventTarget, partial?: Partial<SecurityPolicyViolationEvent>) {
  const event = new Event('securitypolicyviolation') as SecurityPolicyViolationEvent;
  Object.assign(event, {
    violatedDirective: 'img-src',
    effectiveDirective: 'img-src',
    blockedURI: 'https://example.com/blocked.png',
    documentURI: 'http://localhost/',
    disposition: 'enforce',
    ...partial,
  });
  target.dispatchEvent(event);
}

describe('cspErrorsIntegration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('captures securitypolicyviolation on window', async () => {
    const inner = new MockTransport({ url: 'https://localhost/envelope/' });
    const client = new BrowserClient({
      dsn: 'http://localhost:3001/api/sentry/demo',
      sdk,
      transport: new BufferTransport(inner),
      integrations: [cspErrorsIntegration()],
    });

    dispatchCspViolation(window);
    await client.flush(200);

    expect(inner.sent.length).toBe(1);
    const payload = inner.sent[0]!.items[0]!.payload as {
      tags?: Record<string, string>;
      exception: { values: { value: string; mechanism?: { type: string } }[] };
    };
    expect(payload.tags?.['error.type']).toBe('csp');
    expect(payload.exception.values[0]!.value).toContain('img-src');
    expect(payload.exception.values[0]!.mechanism?.type).toBe('onsecuritypolicyviolation');
  });

  it('dedupes duplicate window and document events', async () => {
    const inner = new MockTransport({ url: 'https://localhost/envelope/' });
    const client = new BrowserClient({
      dsn: 'http://localhost:3001/api/sentry/demo',
      sdk,
      transport: new BufferTransport(inner),
      integrations: [cspErrorsIntegration()],
    });

    dispatchCspViolation(document);
    dispatchCspViolation(window);
    await client.flush(200);

    expect(inner.sent.length).toBe(1);
  });
});
