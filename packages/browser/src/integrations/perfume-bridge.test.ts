import { describe, expect, it } from 'vitest';
import { mapPerfumeReport } from './perfume-bridge.js';

const nav = {
  deviceMemory: 8,
  hardwareConcurrency: 8,
  isLowEndDevice: false,
  isLowEndExperience: false,
  serviceWorkerStatus: 'unsupported' as const,
};

describe('mapPerfumeReport', () => {
  it('maps numeric Web Vitals', () => {
    const out = mapPerfumeReport({
      metricName: 'LCP',
      data: 2100,
      rating: 'good',
      attribution: {},
      navigatorInformation: nav,
      navigationType: 'navigate',
    });
    expect(out).toHaveLength(1);
    expect(out[0]?.metric).toBe('LCP');
    expect(out[0]?.metric_value).toBe(2100);
    expect(out[0]?.metric_rating).toBe('good');
    expect(out[0]?.navigation_type).toBe('navigate');
    expect(out[0]?.vital_reporting).toBeUndefined();
  });

  it('maps CLS with zero duration_ms', () => {
    const out = mapPerfumeReport({
      metricName: 'CLS',
      data: 0.08,
      rating: 'good',
      attribution: {},
      navigatorInformation: nav,
    });
    expect(out[0]?.duration_ms).toBe(0);
    expect(out[0]?.metric_value).toBe(0.08);
  });

  it('maps element timing ET with identifier', () => {
    const out = mapPerfumeReport({
      metricName: 'ET',
      data: 256,
      rating: 'good',
      attribution: { identifier: 'elPageTitle' },
      navigatorInformation: nav,
    });
    expect(out[0]?.metric).toBe('ET.elPageTitle');
    expect(out[0]?.transaction).toBe('element-timing.elPageTitle');
  });

  it('explodes navigationTiming without duplicate TTFB', () => {
    const out = mapPerfumeReport({
      metricName: 'navigationTiming',
      data: { timeToFirstByte: 200, redirectTime: 50, dnsLookupTime: 10 },
      rating: null,
      attribution: {},
      navigatorInformation: nav,
    });
    expect(out.some((r) => r.metric === 'nav.redirect')).toBe(true);
    expect(out.some((r) => r.metric?.includes('ttfb'))).toBe(false);
  });

  it('maps dataConsumption per category', () => {
    const out = mapPerfumeReport({
      metricName: 'dataConsumption',
      data: { script: 100, total: 500, css: 0 },
      rating: null,
      attribution: {},
      navigatorInformation: nav,
    });
    expect(out).toHaveLength(2);
    expect(out.map((r) => r.metric)).toEqual(expect.arrayContaining(['data.script', 'data.total']));
  });

  it('maps resource timing entry', () => {
    const out = mapPerfumeReport({
      metricName: 'resourceTiming',
      data: {
        name: 'https://cdn.example/app.js',
        duration: 120,
        initiatorType: 'script',
        transferSize: 4096,
      } as PerformanceResourceTiming,
      rating: null,
      attribution: {},
      navigatorInformation: nav,
    });
    expect(out[0]?.url).toContain('app.js');
    expect(out[0]?.metric).toBe('resource.timing');
    expect(out[0]?.duration_ms).toBe(120);
  });

  it('maps web-vitals needs-improvement rating', () => {
    const out = mapPerfumeReport({
      metricName: 'LCP',
      data: 3200,
      rating: 'needs-improvement' as never,
      attribution: {},
      navigatorInformation: nav,
    });
    expect(out[0]?.metric_rating).toBe('needs-improvement');
  });

  it('drops resource timing when filter returns true', () => {
    const envelope =
      'http://localhost:3001/api/sentry/envelope/demo/api/sentry/envelope/demo/';
    const out = mapPerfumeReport(
      {
        metricName: 'resourceTiming',
        data: {
          name: envelope,
          duration: 50,
          initiatorType: 'fetch',
          transferSize: 100,
        } as PerformanceResourceTiming,
        rating: null,
        attribution: {},
        navigatorInformation: nav,
      },
      (url) => url.includes('/api/sentry/envelope/demo'),
    );
    expect(out).toEqual([]);
  });

  it('maps userJourneyStep with step name in perf_context', () => {
    const out = mapPerfumeReport({
      metricName: 'userJourneyStep',
      data: 1200,
      rating: null,
      attribution: { step_name: 'checkout' },
      navigatorInformation: nav,
    });
    expect(out[0]?.metric).toBe('userJourneyStep');
    expect(out[0]?.transaction).toBe('user.journey');
    expect(out[0]?.perf_context?.stepName).toBe('checkout');
  });

  it('maps RT round-trip time', () => {
    const out = mapPerfumeReport({
      metricName: 'RT',
      data: 95,
      rating: null,
      attribution: {},
      navigatorInformation: nav,
    });
    expect(out[0]?.metric).toBe('RT');
    expect(out[0]?.duration_ms).toBe(95);
  });

  it('maps networkInformation to network.info', () => {
    const out = mapPerfumeReport({
      metricName: 'networkInformation',
      data: { effectiveType: '4g', downlink: 10 },
      rating: null,
      attribution: {},
      navigatorInformation: nav,
    });
    expect(out[0]?.metric).toBe('network.info');
    expect(out[0]?.duration_ms).toBe(0);
    expect(out[0]?.perf_context?.network).toEqual({ effectiveType: '4g', downlink: 10 });
  });

  it('maps storageEstimate to storage.estimate', () => {
    const out = mapPerfumeReport({
      metricName: 'storageEstimate',
      data: { quota: 1_000_000, usage: 500_000 },
      rating: null,
      attribution: {},
      navigatorInformation: nav,
    });
    expect(out[0]?.metric).toBe('storage.estimate');
    expect(out[0]?.perf_context?.storage).toEqual({ quota: 1_000_000, usage: 500_000 });
  });

  it('filters navigationTiming fields with zero values', () => {
    const out = mapPerfumeReport({
      metricName: 'navigationTiming',
      data: { fetchTime: 30, dnsLookupTime: 0, redirectTime: 0 },
      rating: null,
      attribution: {},
      navigatorInformation: nav,
    });
    expect(out).toHaveLength(1);
    expect(out[0]?.metric).toBe('nav.fetch');
  });

  it('maps headerSize with zero duration_ms', () => {
    const out = mapPerfumeReport({
      metricName: 'navigationTiming',
      data: { headerSize: 512, fetchTime: 0 },
      rating: null,
      attribution: {},
      navigatorInformation: nav,
    });
    expect(out).toHaveLength(1);
    expect(out[0]?.metric).toBe('nav.headerSize');
    expect(out[0]?.duration_ms).toBe(0);
  });
});
