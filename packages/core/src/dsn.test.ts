import { describe, expect, it } from 'vitest';
import { parseDsn } from './dsn.js';

describe('parseDsn', () => {
  it('preserves https scheme for remote hosts', () => {
    expect(parseDsn('https://ingest.example.com/api/sentry/envelope/proj-1')).toEqual({
      projectId: 'proj-1',
      envelopeUrl: 'https://ingest.example.com/api/sentry/envelope/proj-1/',
    });
  });

  it('preserves http scheme for local ingest', () => {
    expect(parseDsn('http://localhost:3001/api/sentry/envelope/proj-1')).toEqual({
      projectId: 'proj-1',
      envelopeUrl: 'http://localhost:3001/api/sentry/envelope/proj-1/',
    });
  });

  it('downgrades https on loopback to http ingest', () => {
    expect(parseDsn('https://localhost:3001/api/sentry/envelope/proj-1')).toEqual({
      projectId: 'proj-1',
      envelopeUrl: 'http://localhost:3001/api/sentry/envelope/proj-1/',
    });
  });

  it('strips trailing slash on DSN', () => {
    expect(parseDsn('http://localhost:3001/api/sentry/envelope/proj-1/')).toEqual({
      projectId: 'proj-1',
      envelopeUrl: 'http://localhost:3001/api/sentry/envelope/proj-1/',
    });
  });

  it('rejects legacy ingest path', () => {
    expect(() => parseDsn('http://localhost:3001/api/sentry/proj-1')).toThrow(/Invalid DSN/);
  });

  it('rejects legacy publicKey@ format', () => {
    expect(() => parseDsn('http://key@localhost:3001/api/proj-1')).toThrow(/Invalid DSN/);
  });
});
