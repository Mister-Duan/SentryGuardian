import type { Client } from '@sentry-guardian/core';
import type { PerfumeTransactionPartial } from './perfume-bridge.js';

const DEFAULT_FLUSH_MS = 400;
const DEFAULT_MAX_BATCH = 30;

/** Low-volume metrics: flush immediately (not batched). 低体量指标：立即 flush，不进入延迟批量。 */
const IMMEDIATE_METRICS = new Set([
  'TTFB',
  'FCP',
  'LCP',
  'CLS',
  'FID',
  'INP',
  'TBT',
  'NTBT',
  'RT',
  'network.info',
  'storage.estimate',
]);

function shouldFlushImmediately(partial: PerfumeTransactionPartial): boolean {
  if (partial.metric != null && IMMEDIATE_METRICS.has(partial.metric)) {
    return true;
  }
  return partial.metric?.startsWith('nav.') === true;
}

/**
 * Batch perfume transaction partials to reduce ingest POSTs and survive page unload.
 * 批量合并 perfume 事务片段，减少 ingest POST 并在页面卸载时尽力上报。
 */
export function createPerformanceBatchCapture(
  client: Client,
  options?: { flushMs?: number; maxBatchSize?: number },
): (partial: PerfumeTransactionPartial) => void {
  const flushMs = options?.flushMs ?? DEFAULT_FLUSH_MS;
  const maxBatchSize = options?.maxBatchSize ?? DEFAULT_MAX_BATCH;
  const pending: PerfumeTransactionPartial[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = (sync = false) => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    if (pending.length === 0) {
      return;
    }
    const batch = pending.splice(0);
    if (sync) {
      client.captureTransactionsSync(batch);
      return;
    }
    client.captureTransactions(batch);
  };

  const schedule = () => {
    if (timer === undefined) {
      timer = setTimeout(() => flush(false), flushMs);
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Defer until perfume enqueue CLS·INP·LCP for this hide event.
        // 推迟到 perfume 在本轮 hidden 事件入队之后。
        setTimeout(() => flush(true), 0);
      }
    });
  }
  const flushOnUnload = () => {
    setTimeout(() => flush(true), 0);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flushOnUnload);
  }

  return (partial: PerfumeTransactionPartial) => {
    pending.push(partial);
    if (shouldFlushImmediately(partial)) {
      flush(false);
      return;
    }
    if (pending.length >= maxBatchSize) {
      flush(false);
      return;
    }
    schedule();
  };
}
