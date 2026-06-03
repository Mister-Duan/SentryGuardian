import { describe, expect, it } from 'vitest';
import type { ErrorEvent } from './event.js';

const minimalErrorEventFixture: ErrorEvent = {
  event_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  timestamp: '2026-06-03T12:00:00.000Z',
  platform: 'javascript',
  level: 'error',
  exception: {
    values: [
      {
        type: 'Error',
        value: 'test error',
        stacktrace: {
          frames: [{ filename: 'app.js', function: 'main', lineno: 1, in_app: true }],
        },
      },
    ],
  },
  sdk: { name: 'sentry-guardian.javascript.browser', version: '0.1.0' },
};

describe('ErrorEvent fixture', () => {
  it('matches minimal error event shape', () => {
    expect(minimalErrorEventFixture).toMatchSnapshot();
    expect(minimalErrorEventFixture.event_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(minimalErrorEventFixture.exception?.values[0]?.type).toBe('Error');
  });
});
