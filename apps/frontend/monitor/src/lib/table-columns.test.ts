import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadColumnOrder, mergeColumnOrder, reorderColumns } from './table-columns.js';

describe('mergeColumnOrder', () => {
  it('keeps saved order and appends new columns', () => {
    expect(mergeColumnOrder(['b', 'a'], ['a', 'b', 'c'])).toEqual(['b', 'a', 'c']);
  });

  it('drops unknown saved ids', () => {
    expect(mergeColumnOrder(['x', 'b'], ['a', 'b'])).toEqual(['b', 'a']);
  });
});

describe('reorderColumns', () => {
  it('moves dragged column before target', () => {
    expect(reorderColumns(['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'a', 'b']);
  });

  it('returns same order when ids match', () => {
    expect(reorderColumns(['a', 'b'], 'a', 'a')).toEqual(['a', 'b']);
  });
});

describe('loadColumnOrder', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns defaults when storage empty', () => {
    expect(loadColumnOrder('test-empty', ['a', 'b'])).toEqual(['a', 'b']);
  });

  it('reads persisted order', () => {
    const tableId = 'test-persist';
    storage.set(`sg-table-columns:${tableId}`, JSON.stringify(['b', 'a']));
    expect(loadColumnOrder(tableId, ['a', 'b', 'c'])).toEqual(['b', 'a', 'c']);
  });
});
