import { describe, expect, it } from 'vitest';
import type { Envelope } from './envelope.js';

const minimalEnvelopeFixture: Envelope = {
  header: {
    sdk: { name: 'sentry-guardian.javascript.browser', version: '0.1.0' },
    sent_at: '2026-06-03T12:00:00.000Z',
  },
  items: [
    {
      header: { type: 'event', content_type: 'application/json' },
      payload: {
        event_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        timestamp: '2026-06-03T12:00:00.000Z',
        platform: 'javascript',
        level: 'error',
        sdk: { name: 'sentry-guardian.javascript.browser', version: '0.1.0' },
      },
    },
  ],
};

describe('Envelope fixture', () => {
  it('matches minimal envelope shape', () => {
    expect(minimalEnvelopeFixture).toMatchSnapshot();
    expect(minimalEnvelopeFixture.items[0]?.header.type).toBe('event');
  });
});
