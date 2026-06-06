/** URL pattern list for deny/allow filters. URL 过滤模式列表。 */
export type UrlPatternList = Array<string | RegExp>;

/**
 * Whether `url` matches any pattern in the list.
 * `url` 是否匹配列表中任一模式。
 *
 * @example
 * ```ts
 * // Input / 输入
 * urlMatches(['/api/sentry/envelope/'], 'http://localhost:3001/api/sentry/envelope/p1/')
 * // Output / 输出
 * true
 * ```
 */
export function urlMatches(patterns: UrlPatternList, url: string): boolean {
  return patterns.some((pattern) =>
    typeof pattern === 'string' ? url.includes(pattern) : pattern.test(url),
  );
}

/**
 * Whether `url` should be excluded from performance reporting.
 * 是否应从性能上报中排除该 URL。
 *
 * @example
 * ```ts
 * // Input / 输入
 * isUrlDenied(['http://localhost/envelope/p1'], 'http://localhost/envelope/p1/')
 * // Output / 输出
 * true
 * ```
 */
export function isUrlDenied(denyUrls: UrlPatternList, url: string): boolean {
  if (!url || denyUrls.length === 0) {
    return false;
  }
  return urlMatches(denyUrls, url);
}
