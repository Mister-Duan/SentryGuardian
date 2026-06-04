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
 */
export class ApiClient {
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

  async listProjects(): Promise<ProjectResponse[]> {
    const res = await fetch(`${API_BASE}/api/projects`, { headers: this.headers() });
    if (!res.ok) {
      throw new Error('Failed to load projects');
    }
    return res.json() as Promise<ProjectResponse[]>;
  }

  async listIssues(projectId?: string): Promise<IssueListResponse> {
    const q = projectId ? `?project_id=${encodeURIComponent(projectId)}` : '';
    const res = await fetch(`${API_BASE}/api/issues${q}`, { headers: this.headers() });
    if (!res.ok) {
      throw new Error('Failed to load issues');
    }
    return res.json() as Promise<IssueListResponse>;
  }

  async getIssue(id: string): Promise<IssueDetailResponse> {
    const res = await fetch(`${API_BASE}/api/issues/${id}`, { headers: this.headers() });
    if (!res.ok) {
      throw new Error('Issue not found');
    }
    return res.json() as Promise<IssueDetailResponse>;
  }

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
