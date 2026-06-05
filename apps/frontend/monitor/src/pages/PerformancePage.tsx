import { useEffect, useState } from 'react';
import type { ProjectResponse, TransactionSummary } from '@sentry-guardian/types';
import { Card, FilterBar, FilterField, Select, Table, TableHead, TableRow } from '../components/ui.js';
import { usePageHeader } from '../layout/PageHeaderContext.js';
import { useAuth } from '../lib/auth.js';

export function PerformancePage() {
  const { api } = useAuth();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [projectId, setProjectId] = useState('');
  const [items, setItems] = useState<TransactionSummary[]>([]);

  usePageHeader({ title: '性能', description: 'Web Vitals 与慢请求' });

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
    <div className="space-y-3">
      <FilterBar>
        <FilterField label="项目" className="max-w-[200px]">
          <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FilterField>
      </FilterBar>

      <Card className="!p-0">
        <Table className="mx-3 my-2">
          <TableHead>
            <tr>
              <th className="pb-2 pr-3">事务</th>
              <th className="pb-2 pr-3 w-20">ms</th>
              <th className="pb-2 pr-3 w-16">指标</th>
              <th className="pb-2 pr-3">地址</th>
              <th className="pb-2 w-32">时间</th>
            </tr>
          </TableHead>
          <tbody>
            {items.map((tx) => (
              <TableRow key={tx.id}>
                <td className="max-w-[200px] truncate py-1.5 pr-3 text-xs">{tx.transaction}</td>
                <td className="py-1.5 pr-3 text-xs tabular-nums">{tx.duration_ms}</td>
                <td className="py-1.5 pr-3 text-xs">{tx.metric ?? '—'}</td>
                <td className="max-w-[180px] truncate py-1.5 pr-3 text-xs text-[var(--sg-text-muted)]">
                  {tx.url ?? '—'}
                </td>
                <td className="py-1.5 text-xs text-[var(--sg-text-muted)] tabular-nums">
                  {new Date(tx.timestamp).toLocaleString()}
                </td>
              </TableRow>
            ))}
          </tbody>
        </Table>
        {items.length === 0 && (
          <p className="py-6 text-center text-xs text-[var(--sg-text-muted)]">暂无性能数据</p>
        )}
      </Card>
    </div>
  );
}
