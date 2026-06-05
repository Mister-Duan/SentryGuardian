import type {
  IssueDetailResponse,
  IssueListResponse,
  LoginRequest,
  LoginResponse,
  ProjectResponse,
  UpdateIssueStatusRequest,
} from '@sentry-guardian/types';
import type { Issue } from '@sentry-guardian/types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * HTTP client for the monitor REST API.
 * Monitor REST API 的 HTTP 客户端。
 *
 * @example
 * ```ts
 * // Sample / 示例
 * const api = new ApiClient(accessToken);
 * await api.listIssues('proj_1');
 * ```
 */
export class ApiClient {
  /**
   * @param token - Optional Bearer token for authenticated routes. 可选 Bearer 令牌，用于需鉴权的路由。
   */
  constructor(private token?: string) {}

  private headers(): HeadersInit {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) {
      h.Authorization = `Bearer ${this.token}`;
    }
    return h;
  }

  /**
   * Login and return token response.
   * 登录并返回 Token。
   *
   * @example
   * ```ts
   * // Input / 输入
   * await new ApiClient().login({ email: 'a@b.com', password: 'secret' })
   * // Output / 输出
   * { access_token: '…', token_type: 'Bearer', expires_in: 3600 }
   * ```
   */
  async login(body: LoginRequest): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error('Login failed');
    }
    return res.json() as Promise<LoginResponse>;
  }

  /**
   * List projects visible to the authenticated user.
   * 列出当前用户可见的项目。
   *
   * @example
   * ```ts
   * // Input / 输入
   * await new ApiClient(token).listProjects()
   * // Output / 输出
   * ProjectResponse[]
   * ```
   */
  async listProjects(): Promise<ProjectResponse[]> {
    const res = await fetch(`${API_BASE}/api/projects`, { headers: this.headers() });
    if (!res.ok) {
      throw new Error('Failed to load projects');
    }
    return res.json() as Promise<ProjectResponse[]>;
  }

  /**
   * List issues, optionally filtered by project.
   * 列出 Issue，可按项目过滤。
   *
   * @param projectId - When set, only issues for this project. 设置时仅返回该项目下的 Issue。
   *
   * @example
   * ```ts
   * // Input / 输入
   * await new ApiClient(token).listIssues('proj_1')
   * // Output / 输出
   * { items: Issue[], total: number, page: number, page_size: number }
   * ```
   */
  async listIssues(projectId?: string): Promise<IssueListResponse> {
    const q = projectId ? `?project_id=${encodeURIComponent(projectId)}` : '';
    const res = await fetch(`${API_BASE}/api/issues${q}`, { headers: this.headers() });
    if (!res.ok) {
      throw new Error('Failed to load issues');
    }
    return res.json() as Promise<IssueListResponse>;
  }

  /**
   * Fetch issue detail including latest event when available.
   * 获取 Issue 详情（可用时含最近事件）。
   *
   * @param id - Issue primary key. Issue 主键。
   *
   * @example
   * ```ts
   * // Input / 输入
   * await new ApiClient(token).getIssue('iss_1')
   * // Output / 输出
   * { issue: Issue, latest_event?: ErrorEvent }
   * ```
   */
  async getIssue(id: string): Promise<IssueDetailResponse> {
    const res = await fetch(`${API_BASE}/api/issues/${id}`, { headers: this.headers() });
    if (!res.ok) {
      throw new Error('Issue not found');
    }
    return res.json() as Promise<IssueDetailResponse>;
  }

  /**
   * Update issue workflow status.
   * 更新 Issue 工作流状态。
   *
   * @param id - Issue primary key. Issue 主键。
   * @param body - New status payload. 新状态请求体。
   *
   * @example
   * ```ts
   * // Input / 输入
   * await new ApiClient(token).updateIssueStatus('iss_1', { status: 'resolved' })
   * // Output / 输出
   * Issue
   * ```
   */
  async updateIssueStatus(id: string, body: UpdateIssueStatusRequest): Promise<Issue> {
    const res = await fetch(`${API_BASE}/api/issues/${id}`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error('Update failed');
    }
    return res.json() as Promise<Issue>;
  }
}
