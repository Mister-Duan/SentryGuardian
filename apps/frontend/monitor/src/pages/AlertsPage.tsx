import { useEffect, useState } from 'react';
import type { AlertRuleResponse, AlertTrigger, ProjectResponse } from '@sentry-guardian/types';
import { Button, Card, Input } from '../components/ui.js';
import { useAuth } from '../lib/auth.js';

export function AlertsPage() {
  const { api } = useAuth();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [projectId, setProjectId] = useState('');
  const [rules, setRules] = useState<AlertRuleResponse[]>([]);
  const [form, setForm] = useState({
    name: '新 Issue 通知',
    trigger: 'new_issue' as AlertTrigger,
    webhook_url: '',
    threshold: 100,
  });

  useEffect(() => {
    void api.listProjects().then((list) => {
      setProjects(list);
      if (list[0]) setProjectId(list[0].id);
    });
  }, [api]);

  useEffect(() => {
    if (!projectId) return;
    void api.listAlerts(projectId).then(setRules);
  }, [api, projectId]);

  async function createRule(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) return;
    await api.createAlert(projectId, {
      name: form.name,
      trigger: form.trigger,
      webhook_url: form.webhook_url || undefined,
      threshold: form.trigger === 'error_rate' ? form.threshold : undefined,
      enabled: true,
    });
    void api.listAlerts(projectId).then(setRules);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">告警规则</h1>
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
        <h2 className="mb-3 font-medium">新建规则</h2>
        <form className="space-y-3" onSubmit={(e) => void createRule(e)}>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2"
            value={form.trigger}
            onChange={(e) => setForm({ ...form, trigger: e.target.value as AlertTrigger })}
          >
            <option value="new_issue">新 Issue</option>
            <option value="error_rate">1h 错误率阈值</option>
          </select>
          <Input
            placeholder="Webhook URL"
            value={form.webhook_url}
            onChange={(e) => setForm({ ...form, webhook_url: e.target.value })}
          />
          {form.trigger === 'error_rate' && (
            <Input
              type="number"
              placeholder="阈值"
              value={form.threshold}
              onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })}
            />
          )}
          <Button type="submit">保存</Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">已有规则</h2>
        <ul className="space-y-2 text-sm">
          {rules.map((r) => (
            <li key={r.id} className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span>
                {r.name} · {r.trigger} · {r.webhook_url ?? '无 Webhook'}
              </span>
              <Button
                type="button"
                className="bg-red-900/50 text-red-200"
                onClick={() => void api.deleteAlert(projectId, r.id).then(() => api.listAlerts(projectId).then(setRules))}
              >
                删除
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
