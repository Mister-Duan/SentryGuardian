import { describe, expect, it } from 'vitest';
import {
  formatPerformanceMeasure,
  formatTransactionMetricLabel,
  formatVitalValue,
  rateVital,
  vitalGaugePercent,
} from './performance-labels.js';

describe('performance-labels', () => {
  it('rates LCP thresholds', () => {
    expect(rateVital('LCP', 2000)).toBe('good');
    expect(rateVital('LCP', 3500)).toBe('needs-improvement');
    expect(rateVital('LCP', 5000)).toBe('poor');
  });

  it('formats CLS vs duration metrics', () => {
    expect(formatVitalValue('CLS', 0.123)).toBe('0.123');
    expect(formatVitalValue('LCP', 2400.6)).toBe('2401 ms');
  });

  it('computes gauge percent from poor threshold', () => {
    expect(vitalGaugePercent('LCP', 2000)).toBe(50);
    expect(vitalGaugePercent('LCP', 8000)).toBe(100);
  });

  it('merges transaction and metric labels', () => {
    expect(formatTransactionMetricLabel('LCP', 'largest-contentful-paint')).toBe('LCP');
    expect(formatTransactionMetricLabel(undefined, 'http.client')).toBe('HTTP 请求');
  });

  it('merges duration and metric value without duplicate ms', () => {
    expect(formatPerformanceMeasure('LCP', 2400, 2400)).toBe('2400 ms');
    expect(formatPerformanceMeasure('CLS', 0.08, 0)).toBe('0.080');
    expect(formatPerformanceMeasure(undefined, undefined, 1200)).toBe('1200 ms');
    expect(formatPerformanceMeasure('LCP', 2400, 2500)).toBe('2400 ms · 2500 ms');
  });
});
