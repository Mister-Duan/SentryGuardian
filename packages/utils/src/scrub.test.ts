import { describe, expect, it } from 'vitest';
import { scrubObject, scrubUrl } from './scrub.js';

describe('scrubUrl', () => {
  it('removes query and hash', () => {
    expect(scrubUrl('https://example.com/path?q=1#frag')).toBe('https://example.com/path');
  });
});

describe('scrubObject', () => {
  it('filters sensitive keys', () => {
    const result = scrubObject({
      user: 'alice',
      password: 'secret',
      nested: { api_key: 'key123', ok: true },
    });
    expect(result.password).toBe('[Filtered]');
    expect(result.nested).toEqual({ api_key: '[Filtered]', ok: true });
  });
});
