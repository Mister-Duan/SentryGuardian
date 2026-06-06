import { describe, expect, it } from 'vitest';
import {
  createCustomTimeRange,
  createRelativeTimeRange,
  defaultIssueTimeRange,
  formatTimeRangeLabel,
} from './issue-time-range.js';

describe('issue-time-range', () => {
  it('defaults to 12h window', () => {
    const range = defaultIssueTimeRange();
    expect(range.preset).toBe('12h');
    expect(new Date(range.until).getTime() - new Date(range.since).getTime()).toBeCloseTo(
      12 * 3_600_000,
      -3,
    );
  });

  it('createRelativeTimeRange uses fixed now', () => {
    const now = Date.parse('2026-06-06T12:00:00.000Z');
    const range = createRelativeTimeRange('6h', now);
    expect(range.since).toBe('2026-06-06T06:00:00.000Z');
    expect(range.until).toBe('2026-06-06T12:00:00.000Z');
  });

  it('formatTimeRangeLabel shows preset label', () => {
    expect(formatTimeRangeLabel(createRelativeTimeRange('12h', 0))).toBe('近 12 小时');
  });

  it('createCustomTimeRange rejects invalid bounds', () => {
    expect(createCustomTimeRange('2026-06-06T12:00', '2026-06-06T10:00')).toBeNull();
  });
});
