import type { Integration } from '../integration.js';

/**
 * Placeholder integration; dedupe is handled inside Client.
 * 占位集成；去重逻辑由 Client 内部实现。
 *
 * @example
 * ```ts
 * // Input / 输入
 * dedupeIntegration().name
 * // Output / 输出
 * 'Dedupe'
 * ```
 */
export function dedupeIntegration(): Integration {
  return { name: 'Dedupe' };
}
