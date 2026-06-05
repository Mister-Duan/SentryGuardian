/**
 * Issue lifecycle status in the console API.
 * 控制台 API 中的 Issue 生命周期状态。
 *
 * - `unresolved` — active, accepting new events. 活跃，接收新事件。
 * - `resolved` — closed by user; may reopen on new events (future). 用户已解决。
 * - `ignored` — suppressed from default lists. 已忽略，默认列表隐藏。
 */
export type IssueStatus = 'unresolved' | 'resolved' | 'ignored';

/**
 * Aggregated issue record (API / storage shape).
 * 聚合后的 Issue 记录（API / 存储结构）。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const issue: Issue = {
 *   id: 'iss_1',
 *   project_id: 'proj_1',
 *   fingerprint: 'abc123…',
 *   title: 'Cannot read property',
 *   status: 'unresolved',
 *   level: 'error',
 *   first_seen: '2026-06-01T00:00:00.000Z',
 *   last_seen: '2026-06-03T12:00:00.000Z',
 *   event_count: 42,
 *   users_seen: 3,
 * };
 * ```
 */
export interface Issue {
  /** Primary key of the issue row. Issue 行主键。 */
  id: string;
  /** Owning project id. 所属项目 ID。 */
  project_id: string;
  /** Stable grouping hash from stack or custom fingerprint. 由栈或自定义指纹生成的稳定聚合哈希。 */
  fingerprint: string;
  /** Short headline shown in issue lists. Issue 列表展示的简短标题。 */
  title: string;
  /** Workflow status (`unresolved` | `resolved` | `ignored`). 工作流状态。 */
  status: IssueStatus;
  /** Highest severity observed on this issue. 该 Issue 上观察到的最高严重级别。 */
  level: string;
  /** ISO time of the first event in the group. 该分组首条事件的 ISO 时间。 */
  first_seen: string;
  /** ISO time of the most recent event. 最近一条事件的 ISO 时间。 */
  last_seen: string;
  /** Total events merged into this issue. 合并进该 Issue 的事件总数。 */
  event_count: number;
  /** Distinct users seen (MVP counter). 受影响的去重用户数（MVP 计数）。 */
  users_seen: number;
  /** Primary source location for display (e.g. `app.js:10`). 展示用的主要来源位置（如 `app.js:10`）。 */
  culprit?: string;
}
