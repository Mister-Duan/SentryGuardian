import { describe, expect, it } from 'vitest';
import { resolveTimeWindow } from './stats.query.js';

describe('resolveTimeWindow', () => {
  it('defaults to 12 hours relative window', () => {
    const now = Date.now();
    const w = resolveTimeWindow({});
    expect(w.hours).toBe(12);
    expect(w.until.getTime()).toBeGreaterThanOrEqual(now - 1000);
    expect(w.since.getTime()).toBeLessThanOrEqual(w.until.getTime() - 11 * 3_600_000);
  });

  it('uses explicit since/until range', () => {
    const w = resolveTimeWindow({
      since: '2026-06-05T00:00:00.000Z',
      until: '2026-06-05T06:00:00.000Z',
    });
    expect(w.hours).toBe(6);
    expect(w.since.toISOString()).toBe('2026-06-05T00:00:00.000Z');
    expect(w.until.toISOString()).toBe('2026-06-05T06:00:00.000Z');
  });
});
