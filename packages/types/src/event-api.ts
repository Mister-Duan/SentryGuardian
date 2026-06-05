import type { ErrorEvent } from './event.js';

/**
 * Summary row for an event in issue event lists.
 * Issue 事件列表中的事件摘要行。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const row: EventSummary = {
 *   id: 'evt_1',
 *   event_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
 *   timestamp: '2026-06-05T12:00:00.000Z',
 *   environment: 'production',
 *   release: '1.0.0',
 * };
 * ```
 */
export interface EventSummary {
  /** Internal event row id. 内部 event 行 ID。 */
  id: string;
  /** SDK event_id (UUID). SDK 生成的 event_id。 */
  event_id: string;
  /** Event occurrence time (ISO 8601). 事件发生时间。 */
  timestamp: string;
  /** Deployment environment when present. 部署环境（若有）。 */
  environment?: string;
  /** Release version when present. Release 版本（若有）。 */
  release?: string;
  /** End-user id when present. 用户 ID（若有）。 */
  user_id?: string;
}

/**
 * Query for paginated events under an issue.
 * Issue 下分页事件列表的查询参数。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const query: IssueEventListQuery = { page: 1, page_size: 20 };
 * ```
 */
export interface IssueEventListQuery {
  /** 1-based page index. 从 1 开始的页码。 */
  page?: number;
  /** Page size (server may cap). 每页条数。 */
  page_size?: number;
}

/**
 * Paginated event list for an issue.
 * Issue 的分页事件列表响应。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const res: IssueEventListResponse = { items: [], total: 0, page: 1, page_size: 20 };
 * ```
 */
export interface IssueEventListResponse {
  /** Event summaries for the current page. 当前页事件摘要。 */
  items: EventSummary[];
  /** Total events for the issue. 该 Issue 事件总数。 */
  total: number;
  /** Current page. 当前页码。 */
  page: number;
  /** Page size. 每页条数。 */
  page_size: number;
}

/**
 * Full event detail for the console.
 * 控制台使用的完整事件详情。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const detail: EventDetailResponse = {
 *   id: 'evt_1',
 *   event_id: '…',
 *   timestamp: '2026-06-05T12:00:00.000Z',
 *   payload: errorEvent,
 * };
 * ```
 */
export interface EventDetailResponse {
  /** Internal event row id. 内部 event 行 ID。 */
  id: string;
  /** SDK event_id. SDK event_id。 */
  event_id: string;
  /** Issue id when aggregated. 聚合后的 Issue ID。 */
  issue_id?: string;
  /** Event occurrence time. 事件发生时间。 */
  timestamp: string;
  /** Parsed ErrorEvent payload. 解析后的 ErrorEvent 载荷。 */
  payload: ErrorEvent;
}
