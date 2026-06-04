import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Issue, ProjectResponse } from '@sentry-guardian/types';
import { Button, Card } from '../components/ui.js';
import { useAuth } from '../lib/auth.js';

export function IssuesPage() {
  const { api, logout } = useAuth();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [projectId, setProjectId] = useState<string>('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.listProjects().then((list) => {
      setProjects(list);
      if (list[0]) {
        setProjectId(list[0].id);
      }
    });
  }, [api]);

  useEffect(() => {
    if (!projectId) {
      return;
    }
    void api
      .listIssues(projectId)
      .then((res) => setIssues(res.items))
      .catch(() => setError('加载 Issue 失败'));
  }, [api, projectId]);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Issues</h1>
        <Button type="button" onClick={logout} className="bg-zinc-800 text-zinc-100">
          退出
        </Button>
      </header>

      <Card>
        <label className="mb-4 block text-sm text-zinc-400">
          项目
          <select
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        {projects[0]?.dsn && (
          <p className="mb-4 break-all text-xs text-zinc-500">DSN: {projects[0].dsn}</p>
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
                <td className="py-2">{issue.status}</td>
                <td className="py-2">{issue.event_count}</td>
                <td className="py-2">{new Date(issue.last_seen).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {issues.length === 0 && <p className="py-4 text-zinc-500">暂无 Issue</p>}
      </Card>
    </div>
  );
}
