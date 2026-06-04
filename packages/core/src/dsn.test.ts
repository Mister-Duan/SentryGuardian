import { describe, expect, it } from 'vitest';
import { parseDsn } from './dsn.js';

describe('parseDsn', () => {
  it('preserves https scheme', () => {
    expect(parseDsn('https://key@ingest.example.com/api/proj-1')).toEqual({
      publicKey: 'key',
      projectId: 'proj-1',
      envelopeUrl: 'https://ingest.example.com/api/proj-1/envelope/',
    });
  });

  it('preserves http scheme for local ingest', () => {
    expect(parseDsn('http://key@localhost:3001/api/proj-1')).toEqual({
      publicKey: 'key',
      projectId: 'proj-1',
      envelopeUrl: 'http://localhost:3001/api/proj-1/envelope/',
    });
  });

  it('downgrades https on loopback to http ingest', () => {
    expect(parseDsn('https://key@localhost:3001/api/proj-1')).toEqual({
      publicKey: 'key',
      projectId: 'proj-1',
      envelopeUrl: 'http://localhost:3001/api/proj-1/envelope/',
    });
  });
});
