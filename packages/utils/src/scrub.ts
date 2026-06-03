const SENSITIVE_KEY_SUBSTRINGS = ['password', 'token', 'secret', 'authorization', 'cookie', 'api_key'];

/**
 * Strip query string and hash from URL.
 * 去掉 URL 的 query 与 hash。
 *
 * @example
 * ```ts
 * // Input / 输入
 * scrubUrl('https://example.com/path?q=1#frag')
 * // Output / 输出
 * 'https://example.com/path'
 * ```
 */
export function scrubUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    const q = url.indexOf('?');
    const h = url.indexOf('#');
    const end = Math.min(q >= 0 ? q : url.length, h >= 0 ? h : url.length);
    return url.slice(0, end);
  }
}

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEY_SUBSTRINGS.some((s) => lower.includes(s));
}

/**
 * Recursively scrub sensitive keys from a plain object.
 * 递归脱敏对象中的敏感字段。
 *
 * @example
 * ```ts
 * // Input / 输入
 * scrubObject({ user: 'alice', password: 'secret', nested: { api_key: 'k' } })
 * // Output / 输出
 * { user: 'alice', password: '[Filtered]', nested: { api_key: '[Filtered]' } }
 * ```
 */
export function scrubObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj } as Record<string, unknown>;
  for (const key of Object.keys(result)) {
    if (isSensitiveKey(key)) {
      result[key] = '[Filtered]';
      continue;
    }
    const val = result[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = scrubObject(val as Record<string, unknown>);
    }
  }
  return result as T;
}
