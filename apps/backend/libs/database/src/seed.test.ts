import { describe, expect, it } from 'vitest';
import { buildDsn } from './dsn.js';

describe('buildDsn', () => {
  it('formats ingest URL', () => {
    expect(buildDsn('publicKey', 'proj-1', 'localhost:3000')).toBe(
      'https://publicKey@localhost:3000/api/proj-1',
    );
  });
});
