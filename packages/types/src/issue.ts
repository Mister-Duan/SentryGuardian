/** Issue lifecycle status. Issue 生命周期状态。 */
export type IssueStatus = 'unresolved' | 'resolved' | 'ignored';

/**
 * Aggregated issue record (API / storage shape).
 * 聚合后的 Issue 记录（API / 存储结构）。
 */
export interface Issue {
  id: string;
  project_id: string;
  fingerprint: string;
  title: string;
  status: IssueStatus;
  level: string;
  first_seen: string;
  last_seen: string;
  event_count: number;
  users_seen: number;
  /** Primary source location for display. 展示用的主要来源位置。 */
  culprit?: string;
}
