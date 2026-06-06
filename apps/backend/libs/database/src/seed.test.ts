import { describe, expect, it } from 'vitest';
import { buildDsn } from './dsn.js';

describe('buildDsn', () => {
  it('uses http for loopback hosts', () => {
    expect(buildDsn('proj-1', 'localhost:3000')).toBe(
      'http://localhost:3000/api/sentry/envelope/proj-1',
    );
    expect(buildDsn('proj-1', 'ingest.example.com')).toBe(
      'https://ingest.example.com/api/sentry/envelope/proj-1',
    );
  });
});
