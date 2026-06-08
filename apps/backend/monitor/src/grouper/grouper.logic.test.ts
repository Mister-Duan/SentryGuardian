import { describe, expect, it } from 'vitest';
import type { ErrorEvent } from '@sentry-guardian/types';
import { eventCulpritInfo, eventFingerprint, eventTitle } from './grouper.logic.js';

describe('grouper.logic', () => {
  it('uses custom fingerprint when provided', () => {
    const event: ErrorEvent = {
      event_id: '1',
      timestamp: new Date().toISOString(),
      platform: 'javascript',
      level: 'error',
      fingerprint: ['my-group'],
      sdk: { name: 't', version: '0' },
    };
    expect(eventFingerprint(event)).toBe('my-group');
  });

  it('matches golden stack fingerprint', () => {
    const event: ErrorEvent = {
      event_id: '1',
      timestamp: new Date().toISOString(),
      platform: 'javascript',
      level: 'error',
      exception: {
        values: [
          {
            type: 'Error',
            value: 'boom',
            stacktrace: {
              frames: [
                {
                  filename: 'https://cdn.example.com/app.js?v=1',
                  function: 'main',
                  lineno: 10,
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
      sdk: { name: 't', version: '0' },
    };
    expect(eventFingerprint(event)).toBe(
      '1526a98580507a93895be696a181894ca7a25c58d9de72f3e20704640a5c6cf9',
    );
    expect(eventTitle(event)).toBe('boom');
  });

  it('derives culprit_in_app from top in-app frame', () => {
    const event: ErrorEvent = {
      event_id: '1',
      timestamp: new Date().toISOString(),
      platform: 'javascript',
      level: 'error',
      exception: {
        values: [
          {
            type: 'Error',
            value: 'boom',
            stacktrace: {
              frames: [
                {
                  filename: 'webpack:///node_modules/react/index.js',
                  function: 'render',
                  lineno: 1,
                  in_app: false,
                },
                {
                  filename: 'http://localhost/src/App.tsx',
                  function: 'onClick',
                  lineno: 42,
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
      sdk: { name: 't', version: '0' },
    };
    expect(eventCulpritInfo(event)).toEqual({
      culprit: 'http://localhost/src/App.tsx:42',
      culprit_in_app: true,
    });
  });
});
