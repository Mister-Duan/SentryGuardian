/**
 * Safely serialize a value to JSON with depth limit and circular reference handling.
 * 安全序列化为 JSON，限制深度并处理循环引用。
 *
 * @example
 * ```ts
 * // Input / 输入
 * const obj: Record<string, unknown> = { a: 1 };
 * obj.self = obj;
 * safeSerialize(obj)
 * // Output / 输出
 * '{"a":1,"self":"[Circular]"}'
 * ```
 */
export function safeSerialize(value: unknown, maxDepth = 3, maxLength = 1000): string {
  const result = serializeInternal(value, maxDepth, 0, new WeakMap());
  const json = JSON.stringify(result);
  return json.length > maxLength ? `${json.slice(0, maxLength)}...` : json;
}

function serializeInternal(
  value: unknown,
  maxDepth: number,
  depth: number,
  seen: WeakMap<object, true>,
): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'function') {
    return `[Function: ${value.name || 'anonymous'}]`;
  }
  if (depth >= maxDepth) {
    return '[MaxDepth]';
  }
  if (typeof value === 'object') {
    if (seen.has(value)) {
      return '[Circular]';
    }
    seen.set(value, true);
    if (Array.isArray(value)) {
      return value.map((item) => serializeInternal(item, maxDepth, depth + 1, seen));
    }
    const obj: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      obj[key] = serializeInternal(val, maxDepth, depth + 1, seen);
    }
    return obj;
  }
  return String(value);
}
