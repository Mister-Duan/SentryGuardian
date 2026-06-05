import { useEffect, useState } from 'react';
import type { ProjectResponse, TransactionSummary } from '@sentry-guardian/types';
import { Card } from '../components/ui.js';
import { useAuth } from '../lib/auth.js';

export function PerformancePage() {
  const { api } = useAuth();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [projectId, setProjectId] = useState('');
  const [items, setItems] = useState<TransactionSummary[]>([]);

  useEffect(() => {
    void api.listProjects().then((list) => {
      setProjects(list);
      if (list[0]) setProjectId(list[0].id);
    });
  }, [api]);

  useEffect(() => {
    if (!projectId) return;
    void api.listTransactions(projectId).then((res) => setItems(res.items));
  }, [api, projectId]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">性能监控</h1>
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
      <Card>
        <h2 className="mb-3 font-medium">慢请求 / Web Vitals</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-zinc-500">
            <tr>
              <th className="pb-2">事务</th>
              <th className="pb-2">耗时 (ms)</th>
              <th className="pb-2">指标</th>
              <th className="pb-2">URL</th>
              <th className="pb-2">时间</th>
            </tr>
          </thead>
          <tbody>
            {items.map((tx) => (
              <tr key={tx.id} className="border-t border-zinc-800">
                <td className="py-2">{tx.transaction}</td>
                <td className="py-2">{tx.duration_ms}</td>
                <td className="py-2">{tx.metric ?? '—'}</td>
                <td className="max-w-xs truncate py-2">{tx.url ?? '—'}</td>
                <td className="py-2">{new Date(tx.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="py-4 text-zinc-500">暂无性能数据</p>}
      </Card>
    </div>
  );
}
