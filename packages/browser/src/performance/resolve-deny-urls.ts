import { parseDsn } from '@sentry-guardian/core';
import type { UrlPatternList } from '../lib/url-match.js';

/** Options for {@link resolvePerformanceDenyUrls}. 性能 URL 排除列表解析选项。 */
export type ResolvePerformanceDenyUrlsOptions = {
  /** Ingest DSN for this project. 本项目的 ingest DSN。 */
  dsn: string;
  /** Actual envelope POST target (tunnel when set). 实际上报 POST 地址（tunnel 优先）。 */
  ingestUrl?: string;
  /** Extra URL patterns to exclude from performance transactions. 额外排除的性能 URL 模式。 */
  denyUrls?: UrlPatternList;
  /**
   * When false, do not auto-exclude SDK ingest URLs from performance.
   * 为 false 时不自动排除 SDK ingest URL。
   * @default true
   */
  ignoreIngest?: boolean;
};

function normalizeUrlForMatch(url: string): string {
  return url.replace(/\/+$/, '');
}

function addUniquePattern(patterns: UrlPatternList, value: string): void {
  const normalized = normalizeUrlForMatch(value);
  if (!normalized) {
    return;
  }
  const exists = patterns.some(
    (p) => typeof p === 'string' && normalizeUrlForMatch(p) === normalized,
  );
  if (!exists) {
    patterns.push(normalized);
  }
}

function addPathPattern(patterns: UrlPatternList, path: string): void {
  const normalized = normalizeUrlForMatch(path);
  if (!normalized) {
    return;
  }
  const exists = patterns.some((p) => typeof p === 'string' && p === normalized);
  if (!exists) {
    patterns.push(normalized);
  }
}

function addIngestPathPatterns(patterns: UrlPatternList, projectId: string): void {
  addPathPattern(patterns, `/api/sentry/envelope/${projectId}`);
  addPathPattern(patterns, '/api/sentry/envelope/');
}

function addUrlPathPatterns(patterns: UrlPatternList, url: string): void {
  try {
    addPathPattern(patterns, new URL(url).pathname);
  } catch {
    if (url.startsWith('/')) {
      addPathPattern(patterns, url);
    }
  }
}

/**
 * Build performance deny URL list: ingest envelope URL(s) plus user patterns.
 * 构建性能排除 URL 列表：ingest envelope URL + 用户自定义模式。
 *
 * @example
 * ```ts
 * // Input / 输入
 * resolvePerformanceDenyUrls({
 *   dsn: 'http://localhost:3001/api/sentry/envelope/demo',
 *   denyUrls: [/analytics/],
 * })
 * // Output / 输出
 * ['http://localhost:3001/api/sentry/envelope/demo', /analytics/]
 * ```
 */
export function resolvePerformanceDenyUrls(
  options: ResolvePerformanceDenyUrlsOptions,
): UrlPatternList {
  const ignoreIngest = options.ignoreIngest !== false;
  const out: UrlPatternList = [];

  if (ignoreIngest) {
    const { envelopeUrl, projectId } = parseDsn(options.dsn);
    addUniquePattern(out, envelopeUrl);
    addIngestPathPatterns(out, projectId);
    if (options.ingestUrl) {
      addUniquePattern(out, options.ingestUrl);
      addUrlPathPatterns(out, options.ingestUrl);
    }
  }

  for (const pattern of options.denyUrls ?? []) {
    out.push(pattern);
  }

  return out;
}
