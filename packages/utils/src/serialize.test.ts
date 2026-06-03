import { describe, expect, it } from 'vitest';
import { safeSerialize } from './serialize.js';

describe('safeSerialize', () => {
  it('handles circular references', () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    const json = safeSerialize(obj);
    expect(json).toContain('[Circular]');
  });

  it('respects maxDepth', () => {
    const deep = { l1: { l2: { l3: { l4: 'x' } } } };
    const json = safeSerialize(deep, 2);
    expect(json).toContain('[MaxDepth]');
  });
});
