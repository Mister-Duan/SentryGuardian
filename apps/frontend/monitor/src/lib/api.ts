import type {
  AlertRuleRequest,
  AlertRuleResponse,
  CreateIssueCommentRequest,
  CreateProjectRequest,
  CreateReleaseRequest,
  EventDetailResponse,
  IssueCommentResponse,
  IssueDetailResponse,
  IssueEventListResponse,
  IssueListQuery,
  IssueListResponse,
  IssueStatsQuery,
  ErrorBreakdownResponse,
  ErrorTypeTrendResponse,
  IssueErrorBreakdownResponse,
  IssueTrendResponse,
  LoginRequest,
  LoginResponse,
  PerformanceSummaryResponse,
  ProjectResponse,
  ReleaseCompareResponse,
  ReleaseResponse,
  RotateKeyResponse,
  SetupRequest,
  SetupResponse,
  SetupStatusResponse,
  TransactionListQuery,
  TransactionListResponse,
  UpdateIssueStatusRequest,
} from '@sentry-guardian/types';
import { appendTransactionParams } from './performance-query.js';
import type { Issue } from '@sentry-guardian/types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export class ApiClient {
  constructor(private token?: string) {}

  private headers(json = true): HeadersInit {
    const h: Record<string, string> = {};
    if (json) {
      h['Content-Type'] = 'application/json';
    }
    if (this.token) {
      h.Authorization = `Bearer ${this.token}`;
    }
    return h;
  }

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

  async setupStatus(): Promise<SetupStatusResponse> {
    const res = await fetch(`${API_BASE}/api/setup/status`);
    return res.json() as Promise<SetupStatusResponse>;
  }

  async setup(body: SetupRequest): Promise<SetupResponse> {
    const res = await fetch(`${API_BASE}/api/setup`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error('Setup failed');
    }
    return res.json() as Promise<SetupResponse>;
  }

  async listProjects(): Promise<ProjectResponse[]> {
    const res = await fetch(`${API_BASE}/api/projects`, { headers: this.headers() });
    if (!res.ok) {
      throw new Error('Failed to load projects');
    }
    return res.json() as Promise<ProjectResponse[]>;
  }

  async createProject(body: CreateProjectRequest): Promise<ProjectResponse> {
    const res = await fetch(`${API_BASE}/api/projects`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error('Create project failed');
    }
    return res.json() as Promise<ProjectResponse>;
  }

  async rotateKey(projectId: string): Promise<RotateKeyResponse> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/rotate-key`, {
      method: 'POST',
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error('Rotate key failed');
    }
    return res.json() as Promise<RotateKeyResponse>;
  }

  async listIssues(query?: IssueListQuery): Promise<IssueListResponse> {
    const params = new URLSearchParams();
    if (query?.project_id) params.set('project_id', query.project_id);
    if (query?.status) params.set('status', query.status);
    if (query?.search) params.set('search', query.search);
    if (query?.environment) params.set('environment', query.environment);
    if (query?.release) params.set('release', query.release);
    if (query?.exception_type) params.set('exception_type', query.exception_type);
    if (query?.mechanism) params.set('mechanism', query.mechanism);
    if (query?.level) params.set('level', query.level);
    if (query?.since) params.set('since', query.since);
    if (query?.until) params.set('until', query.until);
    if (query?.page != null) params.set('page', String(query.page));
    if (query?.page_size != null) params.set('page_size', String(query.page_size));
    const q = params.toString() ? `?${params.toString()}` : '';
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

  async listIssueEvents(issueId: string, page = 1): Promise<IssueEventListResponse> {
    const res = await fetch(`${API_BASE}/api/issues/${issueId}/events?page=${page}`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error('Failed to load events');
    }
    return res.json() as Promise<IssueEventListResponse>;
  }

  async getEvent(id: string): Promise<EventDetailResponse> {
    const res = await fetch(`${API_BASE}/api/events/${id}`, { headers: this.headers() });
    if (!res.ok) {
      throw new Error('Event not found');
    }
    return res.json() as Promise<EventDetailResponse>;
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

  async listReleases(projectId: string): Promise<ReleaseResponse[]> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/releases`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error('Failed to load releases');
    }
    return res.json() as Promise<ReleaseResponse[]>;
  }

  async createRelease(projectId: string, body: CreateReleaseRequest): Promise<ReleaseResponse> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/releases`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error('Create release failed');
    }
    return res.json() as Promise<ReleaseResponse>;
  }

  async uploadSourceMap(
    projectId: string,
    releaseId: string,
    file: File,
  ): Promise<{ name: string }> {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(
      `${API_BASE}/api/projects/${projectId}/releases/${releaseId}/artifacts`,
      { method: 'POST', headers: this.headers(false), body: form },
    );
    if (!res.ok) {
      throw new Error('Upload failed');
    }
    return res.json() as Promise<{ name: string }>;
  }

  async errorTypeTrends(
    projectId: string,
    query: IssueStatsQuery,
    dimension: 'type' | 'mechanism' = 'type',
  ): Promise<ErrorTypeTrendResponse> {
    const params = new URLSearchParams({ dimension });
    if (query.hours != null) params.set('hours', String(query.hours));
    if (query.since) params.set('since', query.since);
    if (query.until) params.set('until', query.until);
    if (query.status) params.set('status', query.status);
    if (query.environment) params.set('environment', query.environment);
    if (query.exception_type) params.set('exception_type', query.exception_type);
    if (query.mechanism) params.set('mechanism', query.mechanism);
    if (query.level) params.set('level', query.level);
    const res = await fetch(
      `${API_BASE}/api/projects/${projectId}/error-type-trends?${params.toString()}`,
      { headers: this.headers() },
    );
    if (!res.ok) {
      throw new Error('Failed to load error type trends');
    }
    return res.json() as Promise<ErrorTypeTrendResponse>;
  }

  async errorBreakdown(projectId: string, query: IssueStatsQuery): Promise<ErrorBreakdownResponse> {
    const params = new URLSearchParams();
    if (query.hours != null) params.set('hours', String(query.hours));
    if (query.since) params.set('since', query.since);
    if (query.until) params.set('until', query.until);
    if (query.status) params.set('status', query.status);
    if (query.environment) params.set('environment', query.environment);
    if (query.exception_type) params.set('exception_type', query.exception_type);
    if (query.mechanism) params.set('mechanism', query.mechanism);
    if (query.level) params.set('level', query.level);
    const q = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/error-breakdown${q}`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error('Failed to load error breakdown');
    }
    return res.json() as Promise<ErrorBreakdownResponse>;
  }

  async issueErrorBreakdown(issueId: string): Promise<IssueErrorBreakdownResponse> {
    const res = await fetch(`${API_BASE}/api/issues/${issueId}/error-breakdown`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error('Failed to load issue breakdown');
    }
    return res.json() as Promise<IssueErrorBreakdownResponse>;
  }

  async issueTrends(projectId: string, hours = 24): Promise<IssueTrendResponse> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/trends?hours=${hours}`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error('Failed to load trends');
    }
    return res.json() as Promise<IssueTrendResponse>;
  }

  async releaseCompare(projectId: string): Promise<ReleaseCompareResponse> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/releases/compare`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error('Failed to load release compare');
    }
    return res.json() as Promise<ReleaseCompareResponse>;
  }

  async performanceSummary(
    projectId: string,
    query: TransactionListQuery,
  ): Promise<PerformanceSummaryResponse> {
    const params = new URLSearchParams();
    appendTransactionParams(params, query);
    const q = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/performance-summary${q}`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error('Failed to load performance summary');
    }
    return res.json() as Promise<PerformanceSummaryResponse>;
  }

  async listTransactions(
    projectId: string,
    query: TransactionListQuery = {},
  ): Promise<TransactionListResponse> {
    const params = new URLSearchParams();
    appendTransactionParams(params, query);
    const q = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/transactions${q}`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error('Failed to load transactions');
    }
    return res.json() as Promise<TransactionListResponse>;
  }

  async listAlerts(projectId: string): Promise<AlertRuleResponse[]> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/alerts`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error('Failed to load alerts');
    }
    return res.json() as Promise<AlertRuleResponse[]>;
  }

  async createAlert(projectId: string, body: AlertRuleRequest): Promise<AlertRuleResponse> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/alerts`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error('Create alert failed');
    }
    return res.json() as Promise<AlertRuleResponse>;
  }

  async deleteAlert(projectId: string, id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/alerts/${id}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error('Delete alert failed');
    }
  }

  async listComments(issueId: string): Promise<IssueCommentResponse[]> {
    const res = await fetch(`${API_BASE}/api/issues/${issueId}/comments`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error('Failed to load comments');
    }
    return res.json() as Promise<IssueCommentResponse[]>;
  }

  async addComment(issueId: string, body: CreateIssueCommentRequest): Promise<IssueCommentResponse> {
    const res = await fetch(`${API_BASE}/api/issues/${issueId}/comments`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error('Add comment failed');
    }
    return res.json() as Promise<IssueCommentResponse>;
  }
}
