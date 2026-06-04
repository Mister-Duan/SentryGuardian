import type { Integration } from '@sentry-guardian/core';

/**
 * Marker integration; linked errors are applied in {@link BrowserClient}.
 * 标记集成；Error.cause 链由 {@link BrowserClient} 处理。
 *
 * @example
 * ```ts
 * // Input / 输入
 * linkedErrorsIntegration().name
 * // Output / 输出
 * 'LinkedErrors'
 * ```
 */
export function linkedErrorsIntegration(): Integration {
  return { name: 'LinkedErrors' };
}
