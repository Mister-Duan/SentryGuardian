import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Client, MockTransport } from '@sentry-guardian/core';
import { performanceIntegration } from './performance.js';

const initPerfumeMock = vi.fn();

vi.mock('perfume.js', () => ({
  initPerfume: (opts: unknown) => initPerfumeMock(opts),
}));

const dsn = 'http://localhost:3001/api/sentry/envelope/demo';
const ingestUrl = `${dsn}/`;
const sdk = { name: 'test.browser', version: '0.1.0' };

const nav = {
  deviceMemory: 8,
  hardwareConcurrency: 8,
  isLowEndDevice: false,
  isLowEndExperience: false,
  serviceWorkerStatus: 'unsupported' as const,
};

type InitPerfumeOptions = {
  resourceTiming?: boolean;
  elementTiming?: boolean;
  reportOptions?: { lcp?: { reportAllChanges?: boolean } };
  analyticsTracker?: (report: {
    metricName: string;
    data: unknown;
    rating: string | null;
    attribution: object;
    navigatorInformation: typeof nav;
    navigationType?: string;
  }) => void;
};

function setupIntegration(options: Parameters<typeof performanceIntegration>[0] = {}) {
  const inner = new MockTransport({ url: ingestUrl });
  const client = new Client({ dsn, ingestUrl, sdk, transport: inner });
  const captureTransactions = vi.spyOn(client, 'captureTransactions');
  performanceIntegration(options).setup(client);
  const initOptions = initPerfumeMock.mock.calls[0]?.[0] as InitPerfumeOptions | undefined;
  return { client, captureTransactions, initOptions };
}

describe('performanceIntegration', () => {
  beforeEach(() => {
    initPerfumeMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('calls initPerfume with default resourceTiming and elementTiming', () => {
    const { initOptions } = setupIntegration();
    expect(initPerfumeMock).toHaveBeenCalledTimes(1);
    expect(initOptions?.resourceTiming).toBe(true);
    expect(initOptions?.elementTiming).toBe(true);
  });

  it('defaults reportOptions.lcp.reportAllChanges to true', () => {
    const { initOptions } = setupIntegration();
    expect(initOptions?.reportOptions?.lcp?.reportAllChanges).toBe(true);
  });

  it('allows overriding reportOptions.lcp.reportAllChanges', () => {
    const { initOptions } = setupIntegration({
      reportOptions: { lcp: { reportAllChanges: false } },
    });
    expect(initOptions?.reportOptions?.lcp?.reportAllChanges).toBe(false);
  });

  it('routes LCP reports through captureTransactions', () => {
    const { captureTransactions, initOptions } = setupIntegration();
    initOptions?.analyticsTracker?.({
      metricName: 'LCP',
      data: 1800,
      rating: 'good',
      attribution: {},
      navigatorInformation: nav,
      navigationType: 'navigate',
    });
    expect(captureTransactions).toHaveBeenCalledTimes(1);
    expect(captureTransactions.mock.calls[0]?.[0]?.[0]?.metric).toBe('LCP');
  });

  it('skips denied resource timing URLs before capture', () => {
    const { captureTransactions, initOptions } = setupIntegration();
    initOptions?.analyticsTracker?.({
      metricName: 'resourceTiming',
      data: {
        name: ingestUrl,
        duration: 50,
        initiatorType: 'fetch',
        transferSize: 100,
      } as PerformanceResourceTiming,
      rating: null,
      attribution: {},
      navigatorInformation: nav,
    });
    expect(captureTransactions).not.toHaveBeenCalled();
  });

  it('skips initPerfume outside browser', () => {
    vi.stubGlobal('window', undefined);
    const inner = new MockTransport({ url: ingestUrl });
    const client = new Client({ dsn, ingestUrl, sdk, transport: inner });
    performanceIntegration().setup(client);
    expect(initPerfumeMock).not.toHaveBeenCalled();
  });
});
