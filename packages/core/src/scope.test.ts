import { describe, expect, it } from 'vitest';
import { ScopeStack } from './scope.js';

describe('ScopeStack', () => {
  it('withScope isolates tags', () => {
    const stack = new ScopeStack();
    stack.get().setTag('outer', '1');
    stack.withScope((scope) => {
      scope.setTag('inner', '2');
      expect(scope.getTags()).toEqual({ outer: '1', inner: '2' });
    });
    expect(stack.get().getTags()).toEqual({ outer: '1' });
  });
});
