import { afterEach, describe, expect, it } from 'vitest';
import { getFetch, resetFetchCache } from './fetch.js';

describe('getFetch', () => {
  afterEach(() => {
    resetFetchCache();
  });

  it('returns a bound fetch when present', () => {
    const fn = getFetch();
    expect(fn).toBeTypeOf('function');
    expect(fn).not.toBe(globalThis.fetch);
    expect(fn?.name).toBe('bound fetch');
  });

  it('returns the same cached instance', () => {
    const a = getFetch();
    const b = getFetch();
    expect(a).toBe(b);
  });
});
