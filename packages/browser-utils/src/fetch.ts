let cachedFetch: typeof fetch | undefined;

/**
 * Return a bound `fetch` when available (browser or polyfill).
 * 在可用时返回已绑定的 `fetch`（浏览器或 polyfill）。
 *
 * @example
 * ```ts
 * // Input / 输入
 * getFetch()
 * // Output / 输出
 * typeof fetch | undefined
 * ```
 */
export function getFetch(): typeof fetch | undefined {
  if (cachedFetch !== undefined) {
    return cachedFetch;
  }
  if (typeof globalThis.fetch === 'function') {
    cachedFetch = globalThis.fetch.bind(globalThis);
    return cachedFetch;
  }
  return undefined;
}

/**
 * Reset cached fetch (tests only).
 * 重置 fetch 缓存（仅测试）。
 */
export function resetFetchCache(): void {
  cachedFetch = undefined;
}
