import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Issue, IssueStatus, ProjectResponse } from '@sentry-guardian/types';
import { Button, Card, Input } from '../components/ui.js';
import { ISSUE_STATUS_LABELS } from '../lib/format-event.js';
import { useAuth } from '../lib/auth.js';

const REFRESH_MS = 10_000;

type StatusFilter = IssueStatus | 'all';

export function IssuesPage() {
  const { api } = useAuth();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [projectId, setProjectId] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unresolved');
  const [search, setSearch] = useState('');
  const [environment, setEnvironment] = useState('');
  const [release, setRelease] = useState('');
  const [page, setPage] = useState(1);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [trendBuckets, setTrendBuckets] = useState<{ bucket: string; count: number }[]>([]);

  const selectedProject = projects.find((p) => p.id === projectId);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadIssues = useCallback(() => {
    if (!projectId) return;
    void api
      .listIssues({
        project_id: projectId,
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(search ? { search } : {}),
        ...(environment ? { environment } : {}),
        ...(release ? { release } : {}),
        page,
        page_size: pageSize,
      })
      .then((res) => {
        setIssues(res.items);
        setTotal(res.total);
        setError(null);
      })
      .catch(() => setError('加载 Issue 失败'));
    void api.issueTrends(projectId, 24).then((t) => setTrendBuckets(t.buckets));
  }, [api, projectId, statusFilter, search, environment, release, page]);

  useEffect(() => {
    void api.listProjects().then((list) => {
      setProjects(list);
      if (list[0]) setProjectId(list[0].id);
    });
  }, [api]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  useEffect(() => {
    const timer = setInterval(loadIssues, REFRESH_MS);
    return () => clearInterval(timer);
  }, [loadIssues]);

  async function copyDsn() {
    if (!selectedProject?.dsn) return;
    await navigator.clipboard.writeText(selectedProject.dsn);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Issues</h1>
        <Button type="button" onClick={loadIssues} className="bg-zinc-800 text-zinc-100">
          刷新
        </Button>
      </header>

      {trendBuckets.length > 0 && (
        <Card>
          <h2 className="mb-2 text-sm font-medium text-zinc-400">24h 事件趋势</h2>
          <div className="flex h-16 items-end gap-1">
            {trendBuckets.map((b) => (
              <div
                key={b.bucket}
                className="min-w-[4px] flex-1 bg-sky-600"
                style={{ height: `${Math.max(4, Math.min(100, b.count * 8))}%` }}
                title={`${b.bucket}: ${b.count}`}
              />
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-4">
        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm text-zinc-400">
            项目
            <select
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2"
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setPage(1);
              }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-zinc-400">
            状态
            <select
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setPage(1);
              }}
            >
              <option value="all">全部</option>
              <option value="unresolved">未解决</option>
              <option value="resolved">已解决</option>
              <option value="ignored">已忽略</option>
            </select>
          </label>
          <label className="block text-sm text-zinc-400">
            搜索标题
            <Input
              className="mt-1"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="标题 / culprit / fingerprint"
            />
          </label>
          <label className="block text-sm text-zinc-400">
            环境
            <Input
              className="mt-1"
              value={environment}
              onChange={(e) => {
                setEnvironment(e.target.value);
                setPage(1);
              }}
              placeholder="production"
            />
          </label>
          <label className="block text-sm text-zinc-400">
            Release
            <Input
              className="mt-1"
              value={release}
              onChange={(e) => {
                setRelease(e.target.value);
                setPage(1);
              }}
              placeholder="1.0.0"
            />
          </label>
        </div>

        {selectedProject?.dsn && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <p className="min-w-0 flex-1 break-all text-xs text-zinc-500">DSN: {selectedProject.dsn}</p>
            <Button type="button" onClick={() => void copyDsn()} className="bg-zinc-800 text-zinc-100">
              {copied ? '已复制' : '复制 DSN'}
            </Button>
          </div>
        )}

        {error && <p className="text-red-400">{error}</p>}

        <table className="w-full text-left text-sm">
          <thead className="text-zinc-500">
            <tr>
              <th className="pb-2">标题</th>
              <th className="pb-2">状态</th>
              <th className="pb-2">次数</th>
              <th className="pb-2">最近</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.id} className="border-t border-zinc-800">
                <td className="py-2">
                  <Link className="text-sky-400 hover:underline" to={`/issues/${issue.id}`}>
                    {issue.title}
                  </Link>
                </td>
                <td className="py-2">{ISSUE_STATUS_LABELS[issue.status]}</td>
                <td className="py-2">{issue.event_count}</td>
                <td className="py-2">{new Date(issue.last_seen).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {issues.length === 0 && <p className="py-4 text-zinc-500">暂无 Issue</p>}

        <div className="mt-4 flex items-center gap-2 text-sm">
          <Button
            type="button"
            disabled={page <= 1}
            className="bg-zinc-800 text-zinc-100 disabled:opacity-40"
            onClick={() => setPage((p) => p - 1)}
          >
            上一页
          </Button>
          <span className="text-zinc-500">
            {page} / {totalPages}（共 {total} 条）
          </span>
          <Button
            type="button"
            disabled={page >= totalPages}
            className="bg-zinc-800 text-zinc-100 disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </Button>
        </div>
        <p className="mt-2 text-xs text-zinc-600">每 {REFRESH_MS / 1000} 秒自动刷新</p>
      </Card>
    </div>
  );
}
