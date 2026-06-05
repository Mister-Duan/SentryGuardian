/** Breadcrumb severity level. 面包屑严重级别。 */
export type BreadcrumbLevel = 'debug' | 'info' | 'warning' | 'error';

/**
 * Breadcrumb attached to an event.
 * 附着在事件上的面包屑记录。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const crumb: Breadcrumb = {
 *   timestamp: 1717416000,
 *   category: 'ui.click',
 *   message: 'Submit order',
 *   level: 'info',
 * };
 * ```
 */
export interface Breadcrumb {
  /** Unix timestamp in seconds. Unix 时间戳（秒）。 */
  timestamp?: number;
  /** Breadcrumb type (e.g. navigation). 面包屑类型（如 navigation）。 */
  type?: string;
  /** Logical grouping (e.g. console, xhr). 逻辑分组（如 console、xhr）。 */
  category?: string;
  /** Human-readable message. 可读消息。 */
  message?: string;
  /** Severity of this breadcrumb entry. 本条面包屑的严重级别。 */
  level?: BreadcrumbLevel;
  /** Arbitrary structured data. 任意结构化数据。 */
  data?: Record<string, unknown>;
}
