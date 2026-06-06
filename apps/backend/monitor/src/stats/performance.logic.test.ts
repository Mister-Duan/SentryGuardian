import { describe, expect, it } from 'vitest';
import type { TransactionEvent } from '@sentry-guardian/types';
import { buildPerformanceSummary, buildVitalP75Trends, percentile } from './performance.logic.js';

function tx(partial: Partial<TransactionEvent>): TransactionEvent {
  return {
    event_id: '1',
    timestamp: '2026-06-05T12:00:00.000Z',
    type: 'transaction',
    transaction: 'pageload',
    duration_ms: 100,
    sdk: { name: 'test', version: '0.1.0' },
    ...partial,
  };
}

describe('performance.logic', () => {
  it('percentile returns p75', () => {
    expect(percentile([10, 20, 30, 40], 75)).toBe(30);
  });

  it('buildPerformanceSummary aggregates vitals and http stats', () => {
    const t0 = new Date('2026-06-05T10:00:00.000Z');
    const t1 = new Date('2026-06-05T11:00:00.000Z');
    const range = {
      since: new Date('2026-06-05T09:00:00.000Z'),
      until: new Date('2026-06-05T12:00:00.000Z'),
    };
    const summary = buildPerformanceSummary(
      [
        {
          timestamp: t0,
          payload: tx({
            metric: 'LCP',
            metric_value: 2000,
            transaction: 'largest-contentful-paint',
          }),
        },
        {
          timestamp: t1,
          payload: tx({
            metric: 'LCP',
            metric_value: 3000,
            transaction: 'largest-contentful-paint',
          }),
        },
        {
          timestamp: t1,
          payload: tx({
            metric: 'resource.timing',
            metric_value: 50,
            transaction: 'resource.timing',
          }),
        },
        {
          timestamp: t1,
          payload: tx({
            transaction: 'http.client',
            duration_ms: 1500,
            url: 'https://api.example.com',
            status_code: 200,
          }),
        },
      ],
      3,
      range,
    );

    expect(summary.vitals).toHaveLength(1);
    expect(summary.vitals[0]?.metric).toBe('LCP');
    expect(summary.vitals[0]?.p75_value).toBe(3000);
    expect(summary.vitals[0]?.count).toBe(2);
    expect(summary.slow_http_count).toBe(1);
    expect(summary.avg_http_duration_ms).toBe(1500);
    expect(summary.by_metric.some((i) => i.key === 'http.client')).toBe(true);
    expect(summary.volume_trend.length).toBeGreaterThan(0);
    expect(summary.metric_trends.buckets.length).toBeGreaterThan(0);
    expect(summary.vital_trends.series.some((s) => s.metric === 'LCP')).toBe(true);
    expect(summary.http_duration_trend.some((b) => b.count > 0)).toBe(true);
  });

  it('buildVitalP75Trends computes per-bucket p75', () => {
    const t0 = new Date('2026-06-05T10:00:00.000Z');
    const t1 = new Date('2026-06-05T10:30:00.000Z');
    const range = {
      since: new Date('2026-06-05T09:30:00.000Z'),
      until: new Date('2026-06-05T11:00:00.000Z'),
    };
    const trends = buildVitalP75Trends(
      [
        {
          timestamp: t0,
          payload: tx({ metric: 'LCP', metric_value: 1000 }),
        },
        {
          timestamp: t1,
          payload: tx({ metric: 'LCP', metric_value: 3000 }),
        },
      ],
      2,
      undefined,
      range,
    );
    const lcp = trends.series.find((s) => s.metric === 'LCP');
    expect(lcp?.points.some((p) => p.p75_value === 3000)).toBe(true);
  });
});
