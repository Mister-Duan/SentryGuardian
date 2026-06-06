import type { EventLevel } from '@sentry-guardian/types';

/**
 * Optional metadata when capturing an exception.
 * 捕获异常时的可选元数据。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const hint: CaptureHint = {
 *   mechanism: 'onerror',
 *   tags: { 'error.type': 'resource' },
 *   extra: { src: 'https://cdn.example/app.js' },
 * };
 * ```
 */
export interface CaptureHint {
  /** Integration or handler id (e.g. `onerror`). 集成或处理器标识。 */
  mechanism?: string;
  /** Tags merged onto the event (scope tags take precedence on conflict). 合并到事件上的标签。 */
  tags?: Record<string, string>;
  /** Extra fields merged onto the event. 合并到事件上的 extra 字段。 */
  extra?: Record<string, unknown>;
  /** Override default event level. 覆盖默认事件级别。 */
  level?: EventLevel;
  /** Synthetic stack location when no `Error` object is available. 无 Error 对象时的合成栈位置。 */
  syntheticLocation?: { filename?: string; lineno?: number; colno?: number };
}
