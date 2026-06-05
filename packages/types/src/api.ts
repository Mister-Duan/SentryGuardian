import type { ErrorEvent } from './event.js';
import type { Issue, IssueStatus } from './issue.js';

/**
 * Console login request body.
 * 控制台登录请求体。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const body: LoginRequest = { email: 'admin@example.com', password: 'secret' };
 * ```
 */
export interface LoginRequest {
  /** User email registered in the instance. 实例内注册的登录邮箱。 */
  email: string;
  /** Plain-text password (sent over HTTPS only). 明文密码（仅应通过 HTTPS 传输）。 */
  password: string;
}

/**
 * Console login response (OAuth2-style bearer token).
 * 控制台登录响应（OAuth2 风格 Bearer Token）。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const res: LoginResponse = {
 *   access_token: 'eyJ…',
 *   token_type: 'Bearer',
 *   expires_in: 3600,
 * };
 * ```
 */
export interface LoginResponse {
  /** JWT or opaque access token for `Authorization` header. 用于 `Authorization` 头的 JWT 或不透明令牌。 */
  access_token: string;
  /** Token scheme; always `Bearer` in MVP. 令牌方案；MVP 固定为 `Bearer`。 */
  token_type: 'Bearer';
  /** Token lifetime in seconds. 令牌有效期（秒）。 */
  expires_in: number;
}

/**
 * Create project request body.
 * 创建项目请求体。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const body: CreateProjectRequest = { name: 'My App', slug: 'my-app' };
 * ```
 */
export interface CreateProjectRequest {
  /** Human-readable project name. 可读项目名称。 */
  name: string;
  /** URL-safe slug; server may derive from name if omitted. URL 安全 slug；省略时服务端可从名称推导。 */
  slug?: string;
}

/**
 * Project summary returned by the monitor API (includes ingest DSN).
 * Monitor API 返回的项目摘要（含 ingest DSN）。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const project: ProjectResponse = {
 *   id: 'proj_1',
 *   name: 'Demo',
 *   slug: 'demo',
 *   dsn: 'http://localhost:3001/api/sentry/proj_1',
 * };
 * ```
 */
export interface ProjectResponse {
  /** Project primary key. 项目主键。 */
  id: string;
  /** Display name. 展示名称。 */
  name: string;
  /** Unique slug within the organization. 组织内唯一 slug。 */
  slug: string;
  /** Full ingest DSN for SDK `init({ dsn })`. 供 SDK `init({ dsn })` 使用的完整 ingest DSN。 */
  dsn: string;
}

/**
 * Query parameters for the paginated issue list endpoint.
 * 分页 Issue 列表端点的查询参数。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const query: IssueListQuery = { project_id: 'proj_1', status: 'unresolved', page: 1 };
 * ```
 */
export interface IssueListQuery {
  /** Filter by project id. 按项目 ID 过滤。 */
  project_id?: string;
  /** Filter by workflow status. 按工作流状态过滤。 */
  status?: IssueStatus;
  /** 1-based page index. 从 1 开始的页码。 */
  page?: number;
  /** Page size (server may cap). 每页条数（服务端可能设上限）。 */
  page_size?: number;
}

/**
 * Paginated issue list response.
 * 分页 Issue 列表响应。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const res: IssueListResponse = {
 *   items: [],
 *   total: 0,
 *   page: 1,
 *   page_size: 20,
 * };
 * ```
 */
export interface IssueListResponse {
  /** Issues for the current page. 当前页的 Issue 列表。 */
  items: Issue[];
  /** Total matching issues across all pages. 所有页匹配 Issue 的总数。 */
  total: number;
  /** Current page number echoed from the query. 回显的当前页码。 */
  page: number;
  /** Page size echoed from the query. 回显的每页条数。 */
  page_size: number;
}

/**
 * Issue detail with optional latest raw event payload.
 * Issue 详情（可选附带最近一条原始事件载荷）。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const detail: IssueDetailResponse = { issue: issueRow, latest_event: errorEvent };
 * ```
 */
export interface IssueDetailResponse {
  /** Aggregated issue metadata. 聚合后的 Issue 元数据。 */
  issue: Issue;
  /** Most recent `ErrorEvent` JSON for the issue detail UI. Issue 详情 UI 使用的最近 `ErrorEvent` JSON。 */
  latest_event?: ErrorEvent;
}

/**
 * Update issue status request body (`PATCH /api/issues/:id`).
 * 更新 Issue 状态请求体（`PATCH /api/issues/:id`）。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const body: UpdateIssueStatusRequest = { status: 'resolved' };
 * ```
 */
export interface UpdateIssueStatusRequest {
  /** New workflow status to persist. 要持久化的新工作流状态。 */
  status: IssueStatus;
}
