import { describe, expect, it } from 'vitest';
import { resolvePerformanceDenyUrls } from './resolve-deny-urls.js';

describe('resolvePerformanceDenyUrls', () => {
  const dsn = 'http://localhost:3001/api/sentry/envelope/proj-1';

  it('includes envelopeUrl by default', () => {
    const deny = resolvePerformanceDenyUrls({ dsn });
    expect(deny.some((p) => typeof p === 'string' && p.includes('/api/sentry/envelope/proj-1'))).toBe(
      true,
    );
  });

  it('matches ingest resource timing when host differs (127.0.0.1 vs localhost)', () => {
    const deny = resolvePerformanceDenyUrls({ dsn });
    const resourceUrl =
      'http://127.0.0.1:3001/api/sentry/envelope/proj-1/?sentry_version=0';
    expect(
      deny.some(
        (p) => typeof p === 'string' && resourceUrl.includes(p),
      ),
    ).toBe(true);
  });

  it('includes ingestUrl when different from envelopeUrl (tunnel)', () => {
    const deny = resolvePerformanceDenyUrls({
      dsn,
      ingestUrl: 'http://localhost:5173/api/sentry-tunnel',
    });
    expect(deny).toContain('http://localhost:5173/api/sentry-tunnel');
    expect(deny.some((p) => typeof p === 'string' && p.includes('envelope/proj-1'))).toBe(true);
  });

  it('merges user denyUrls', () => {
    const deny = resolvePerformanceDenyUrls({
      dsn,
      denyUrls: [/analytics\.example\.com/],
    });
    expect(deny.some((p) => p instanceof RegExp)).toBe(true);
  });

  it('skips ingest URLs when ignoreIngest is false', () => {
    const deny = resolvePerformanceDenyUrls({
      dsn,
      ignoreIngest: false,
      denyUrls: ['/custom/'],
    });
    expect(deny).toEqual(['/custom/']);
  });
});
