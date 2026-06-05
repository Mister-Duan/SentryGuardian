import { useEffect, useState } from 'react';
import type { AlertRuleResponse, AlertTrigger, ProjectResponse } from '@sentry-guardian/types';
import { Button, Card, FilterBar, FilterField, Input, Select } from '../components/ui.js';
import { usePageHeader } from '../layout/PageHeaderContext.js';
import { useAuth } from '../lib/auth.js';

const ALERT_TRIGGER_LABELS: Record<AlertTrigger, string> = {
  new_issue: '新 Issue',
  error_rate: '1 小时错误率阈值',
};

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

  usePageHeader({ title: '告警', description: 'Webhook 与错误率告警规则' });

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

      <Card>
        <h2 className="mb-2 text-sm font-semibold">新建规则</h2>
        <form className="space-y-2" onSubmit={(e) => void createRule(e)}>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select
            value={form.trigger}
            onChange={(e) => setForm({ ...form, trigger: e.target.value as AlertTrigger })}
          >
            <option value="new_issue">{ALERT_TRIGGER_LABELS.new_issue}</option>
            <option value="error_rate">{ALERT_TRIGGER_LABELS.error_rate}</option>
          </Select>
          <Input
            placeholder="Webhook 地址"
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
          <Button type="submit" variant="primary" size="sm">
            保存
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold">已有规则</h2>
        <ul className="space-y-1.5 text-xs">
          {rules.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--sg-border)] py-1.5 last:border-0"
            >
              <span className="min-w-0 flex-1 truncate">
                {r.name} · {ALERT_TRIGGER_LABELS[r.trigger] ?? r.trigger}
              </span>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() =>
                  void api
                    .deleteAlert(projectId, r.id)
                    .then(() => api.listAlerts(projectId).then(setRules))
                }
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
