import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Client, MockTransport } from '@sentry-guardian/core';
import { createPerformanceBatchCapture } from './performance-batch.js';

const dsn = 'http://localhost:3001/api/sentry/envelope/demo';
const sdk = { name: 'test.browser', version: '0.1.0' };

describe('createPerformanceBatchCapture', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('batches resource timing partials into one captureTransactions call', () => {
    const inner = new MockTransport({ url: 'https://localhost/envelope/' });
    const client = new Client({ dsn, sdk, transport: inner });
    const captureTransactions = vi.spyOn(client, 'captureTransactions');
    const capture = createPerformanceBatchCapture(client, { flushMs: 200, maxBatchSize: 10 });

    capture({
      transaction: 'resource.timing',
      duration_ms: 100,
      metric: 'resource.timing',
      metric_value: 100,
      url: 'https://cdn.example/a.js',
    });
    capture({
      transaction: 'resource.timing',
      duration_ms: 80,
      metric: 'resource.timing',
      metric_value: 80,
      url: 'https://cdn.example/b.js',
    });

    expect(captureTransactions).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(captureTransactions).toHaveBeenCalledTimes(1);
    expect(captureTransactions.mock.calls[0]?.[0]).toHaveLength(2);
  });

  it('flushes immediately for vital metrics like LCP', () => {
    const inner = new MockTransport({ url: 'https://localhost/envelope/' });
    const client = new Client({ dsn, sdk, transport: inner });
    const captureTransactions = vi.spyOn(client, 'captureTransactions');
    const capture = createPerformanceBatchCapture(client, { flushMs: 500, maxBatchSize: 10 });

    capture({ transaction: 'largest-contentful-paint', duration_ms: 1200, metric: 'LCP', metric_value: 1200 });

    expect(captureTransactions).toHaveBeenCalledTimes(1);
    expect(captureTransactions.mock.calls[0]?.[0]?.[0]?.metric).toBe('LCP');
  });

  it('flushes immediately when batch is full', () => {
    const inner = new MockTransport({ url: 'https://localhost/envelope/' });
    const client = new Client({ dsn, sdk, transport: inner });
    const captureTransactions = vi.spyOn(client, 'captureTransactions');
    const capture = createPerformanceBatchCapture(client, { flushMs: 500, maxBatchSize: 2 });

    capture({
      transaction: 'resource.timing',
      duration_ms: 1,
      metric: 'resource.timing',
      metric_value: 1,
      url: 'https://cdn.example/a.js',
    });
    capture({
      transaction: 'resource.timing',
      duration_ms: 2,
      metric: 'resource.timing',
      metric_value: 2,
      url: 'https://cdn.example/b.js',
    });

    expect(captureTransactions).toHaveBeenCalledTimes(1);
    expect(captureTransactions.mock.calls[0]?.[0]).toHaveLength(2);
  });

  it('flushes nav.fetch immediately without waiting for batch timer', () => {
    const inner = new MockTransport({ url: 'https://localhost/envelope/' });
    const client = new Client({ dsn, sdk, transport: inner });
    const captureTransactions = vi.spyOn(client, 'captureTransactions');
    const capture = createPerformanceBatchCapture(client, { flushMs: 500, maxBatchSize: 10 });

    capture({
      transaction: 'navigation.timing',
      duration_ms: 42,
      metric: 'nav.fetch',
      metric_value: 42,
    });

    expect(captureTransactions).toHaveBeenCalledTimes(1);
    expect(captureTransactions.mock.calls[0]?.[0]?.[0]?.metric).toBe('nav.fetch');
    vi.advanceTimersByTime(500);
    expect(captureTransactions).toHaveBeenCalledTimes(1);
  });

  it('flushes sync on visibilitychange hidden', () => {
    const inner = new MockTransport({ url: 'https://localhost/envelope/' });
    const client = new Client({ dsn, sdk, transport: inner });
    const captureTransactionsSync = vi.spyOn(client, 'captureTransactionsSync');
    const capture = createPerformanceBatchCapture(client, { flushMs: 500, maxBatchSize: 10 });

    capture({
      transaction: 'resource.timing',
      duration_ms: 100,
      metric: 'resource.timing',
      metric_value: 100,
      url: 'https://cdn.example/a.js',
    });

    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(0);

    expect(captureTransactionsSync).toHaveBeenCalledTimes(1);
    expect(captureTransactionsSync.mock.calls[0]?.[0]).toHaveLength(1);
  });

  it('flushes sync on pagehide', () => {
    const inner = new MockTransport({ url: 'https://localhost/envelope/' });
    const client = new Client({ dsn, sdk, transport: inner });
    const captureTransactionsSync = vi.spyOn(client, 'captureTransactionsSync');
    const capture = createPerformanceBatchCapture(client, { flushMs: 500, maxBatchSize: 10 });

    capture({
      transaction: 'resource.timing',
      duration_ms: 80,
      metric: 'resource.timing',
      metric_value: 80,
      url: 'https://cdn.example/b.js',
    });

    window.dispatchEvent(new Event('pagehide'));
    vi.advanceTimersByTime(0);

    expect(captureTransactionsSync).toHaveBeenCalledTimes(1);
    expect(captureTransactionsSync.mock.calls[0]?.[0]).toHaveLength(1);
  });
});
