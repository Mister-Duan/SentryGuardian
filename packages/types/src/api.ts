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
 *   dsn: 'http://localhost:3001/api/sentry/envelope/proj_1',
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
  /** Search issue title (case-insensitive substring). 标题搜索（不区分大小写子串）。 */
  search?: string;
  /** Filter by environment on latest occurrence. 按环境过滤。 */
  environment?: string;
  /** Filter by release on latest occurrence. 按 release 过滤。 */
  release?: string;
  /** Filter by latest event exception type (e.g. `TypeError`). 按最近事件异常类型过滤。 */
  exception_type?: string;
  /** Filter by latest event capture mechanism (e.g. `onerror`). 按最近事件捕获机制过滤。 */
  mechanism?: string;
  /** Filter by issue severity level (e.g. `error`). 按严重级别过滤。 */
  level?: string;
  /** ISO8601 lower bound on `last_seen` (inclusive). `last_seen` 下限（含）。 */
  since?: string;
  /** ISO8601 upper bound on `last_seen` (inclusive). `last_seen` 上限（含）。 */
  until?: string;
  /** 1-based page index. 从 1 开始的页码。 */
  page?: number;
  /** Page size (server may cap). 每页条数（服务端可能设上限）。 */
  page_size?: number;
}

/**
 * Shared scope filters for project error stats APIs (charts).
 * 项目错误统计 API（图表）共用的范围筛选参数。
 */
export interface IssueStatsQuery {
  /** Relative window in hours when `since`/`until` omitted (default 12). 相对窗口小时数。 */
  hours?: number;
  /** ISO8601 event timestamp lower bound. 事件时间下限。 */
  since?: string;
  /** ISO8601 event timestamp upper bound. 事件时间上限。 */
  until?: string;
  /** Filter events to issues with this workflow status. 按 Issue 状态过滤事件。 */
  status?: IssueStatus;
  /** Filter by environment on the issue. 按 Issue 环境过滤。 */
  environment?: string;
  /** Filter by exception type on the issue. 按 Issue 异常类型过滤。 */
  exception_type?: string;
  /** Filter by capture mechanism on the issue. 按 Issue 捕获机制过滤。 */
  mechanism?: string;
  /** Filter by severity level on the issue. 按 Issue 严重级别过滤。 */
  level?: string;
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

/** Alert rule trigger type. 告警规则触发类型。 */
export type AlertTrigger = 'new_issue' | 'error_rate';

/**
 * Alert rule returned by the monitor API.
 * Monitor API 返回的告警规则。
 */
export interface AlertRuleResponse {
  /** Rule primary key. 规则主键。 */
  id: string;
  /** Owning project id. 所属项目 ID。 */
  project_id: string;
  /** Display name. 展示名称。 */
  name: string;
  /** Trigger condition. 触发条件。 */
  trigger: AlertTrigger;
  /** Webhook URL when configured. Webhook URL。 */
  webhook_url?: string;
  /** Email recipient when configured. 邮件收件人。 */
  email_to?: string;
  /** Whether the rule is active. 是否启用。 */
  enabled: boolean;
  /** Threshold for error_rate trigger. error_rate 触发阈值。 */
  threshold?: number;
}

/**
 * Create or update alert rule body.
 * 创建或更新告警规则请求体。
 */
export interface AlertRuleRequest {
  name: string;
  trigger: AlertTrigger;
  webhook_url?: string;
  email_to?: string;
  enabled?: boolean;
  threshold?: number;
}

/**
 * Release row for console API.
 * 控制台 Release 行。
 */
export interface ReleaseResponse {
  id: string;
  project_id: string;
  version: string;
  created_at: string;
  artifact_count: number;
}

/**
 * Create release request.
 * 创建 Release 请求。
 */
export interface CreateReleaseRequest {
  version: string;
}

/**
 * Rotate DSN public key response.
 * 轮换 DSN public key 响应。
 */
export interface RotateKeyResponse {
  dsn: string;
  public_key: string;
}

/**
 * Setup wizard status for first-run bootstrap.
 * 首次部署引导状态。
 */
export interface SetupStatusResponse {
  /** Whether initial admin exists. 是否已有管理员。 */
  configured: boolean;
}

/**
 * First-run setup request.
 * 首次部署引导请求。
 */
export interface SetupRequest {
  organization_name: string;
  admin_email: string;
  admin_password: string;
  project_name: string;
}

/**
 * Setup completion response with DSN.
 * 引导完成响应（含 DSN）。
 */
export interface SetupResponse {
  dsn: string;
  project_id: string;
}

/**
 * Issue comment for activity stream.
 * Issue 评论。
 */
export interface IssueCommentResponse {
  id: string;
  issue_id: string;
  author_email: string;
  body: string;
  created_at: string;
}

export interface CreateIssueCommentRequest {
  body: string;
}
