/**
 * Normalize input to ISO 8601 string.
 * 将输入规范为 ISO 8601 时间字符串。
 *
 * @example
 * ```ts
 * // Input / 输入
 * normalizeTimestamp('2026-06-03T12:00:00.000Z')
 * // Output / 输出
 * '2026-06-03T12:00:00.000Z'
 * ```
 */
export function normalizeTimestamp(input?: Date | number | string): string {
  if (input === undefined) {
    return new Date().toISOString();
  }
  if (input instanceof Date) {
    return input.toISOString();
  }
  if (typeof input === 'number') {
    return new Date(input).toISOString();
  }
  const parsed = Date.parse(input);
  if (Number.isNaN(parsed)) {
    return new Date().toISOString();
  }
  return new Date(parsed).toISOString();
}

/**
 * Truncate string to max length with ellipsis.
 * 将字符串截断到最大长度并追加省略号。
 *
 * @example
 * ```ts
 * // Input / 输入
 * truncate('hello world', 8)
 * // Output / 输出
 * 'hello...'
 * ```
 */
export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  if (maxLength <= 3) {
    return value.slice(0, maxLength);
  }
  return `${value.slice(0, maxLength - 3)}...`;
}
