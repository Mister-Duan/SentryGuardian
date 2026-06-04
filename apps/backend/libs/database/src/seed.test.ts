import { describe, expect, it } from 'vitest';
import { buildDsn } from './dsn.js';

describe('buildDsn', () => {
  it('formats ingest URL', () => {
    expect(buildDsn('publicKey', 'proj-1', 'localhost:3000')).toBe(
      'http://publicKey@localhost:3000/api/proj-1',
    );
    expect(buildDsn('publicKey', 'proj-1', 'ingest.example.com')).toBe(
      'https://publicKey@ingest.example.com/api/proj-1',
    );
  });
});
