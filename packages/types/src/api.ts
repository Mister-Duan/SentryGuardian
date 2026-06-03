import type { ErrorEvent } from './event.js';
import type { Issue, IssueStatus } from './issue.js';

/**
 * Console login request body.
 * 控制台登录请求体。
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Console login response.
 * 控制台登录响应。
 */
export interface LoginResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
}

/**
 * Create project request body.
 * 创建项目请求体。
 */
export interface CreateProjectRequest {
  name: string;
  slug?: string;
}

/**
 * Project summary including DSN.
 * 项目摘要（含 DSN）。
 */
export interface ProjectResponse {
  id: string;
  name: string;
  slug: string;
  dsn: string;
}

/**
 * Query parameters for issue list API.
 * Issue 列表 API 查询参数。
 */
export interface IssueListQuery {
  project_id?: string;
  status?: IssueStatus;
  page?: number;
  page_size?: number;
}

/**
 * Paginated issue list response.
 * 分页 Issue 列表响应。
 */
export interface IssueListResponse {
  items: Issue[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * Issue detail with optional latest event.
 * Issue 详情（可选附带最近事件）。
 */
export interface IssueDetailResponse {
  issue: Issue;
  latest_event?: ErrorEvent;
}

/**
 * Update issue status request body.
 * 更新 Issue 状态请求体。
 */
export interface UpdateIssueStatusRequest {
  status: IssueStatus;
}
