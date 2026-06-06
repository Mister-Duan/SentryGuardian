import { describe, expect, it } from 'vitest';
import type { ErrorEvent } from '@sentry-guardian/types';
import {
  aggregateErrorPayloads,
  buildErrorTypeTrends,
  toErrorBreakdownResponse,
} from './error-breakdown.js';

function event(partial: Partial<ErrorEvent>): ErrorEvent {
  return {
    event_id: '1',
    timestamp: '2026-06-05T12:00:00.000Z',
    platform: 'javascript',
    level: 'error',
    sdk: { name: 'test', version: '0.1.0' },
    ...partial,
  };
}

describe('aggregateErrorPayloads', () => {
  it('groups by exception type and mechanism', () => {
    const payloads = [
      event({
        exception: {
          values: [{ type: 'TypeError', value: 'a', mechanism: { type: 'onerror', handled: false } }],
        },
      }),
      event({
        exception: {
          values: [{ type: 'TypeError', value: 'b', mechanism: { type: 'onerror', handled: false } }],
        },
      }),
      event({
        tags: { 'error.type': 'http' },
        exception: {
          values: [{ type: 'Error', value: 'HTTP 500', mechanism: { type: 'http.client', handled: false } }],
        },
      }),
    ];

    const result = aggregateErrorPayloads(payloads);
    expect(result.by_type.find((i) => i.key === 'TypeError')?.count).toBe(2);
    expect(result.by_mechanism.find((i) => i.key === 'onerror')?.count).toBe(2);
    expect(result.by_mechanism.find((i) => i.key === 'http.client')?.count).toBe(1);
  });

  it('builds response with hours window', () => {
    const res = toErrorBreakdownResponse([], 24);
    expect(res.hours).toBe(24);
    expect(res.by_type).toEqual([]);
  });
});

describe('buildErrorTypeTrends', () => {
  it('returns aligned series per time bucket and type', () => {
    const t0 = new Date('2026-06-05T10:00:00.000Z');
    const t1 = new Date('2026-06-05T11:00:00.000Z');
    const rows = [
      {
        timestamp: t0,
        payload: event({
          exception: { values: [{ type: 'TypeError', value: 'a' }] },
        }),
      },
      {
        timestamp: t0,
        payload: event({
          exception: { values: [{ type: 'TypeError', value: 'b' }] },
        }),
      },
      {
        timestamp: t1,
        payload: event({
          exception: { values: [{ type: 'Error', value: 'c' }] },
        }),
      },
    ];

    const res = buildErrorTypeTrends(rows, 24, 'type');
    expect(res.dimension).toBe('type');
    expect(res.buckets.length).toBeGreaterThan(0);
    expect(res.series.some((s) => s.key === 'TypeError')).toBe(true);
    const typeError = res.series.find((s) => s.key === 'TypeError')!;
    const bucket0 = floorBucket(t0, res.bucket_ms);
    expect(typeError.points.find((p) => p.bucket === bucket0)?.count).toBe(2);
  });
});

function floorBucket(date: Date, bucketMs: number): string {
  return new Date(Math.floor(date.getTime() / bucketMs) * bucketMs).toISOString();
}
