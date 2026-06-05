import { useEffect, useState } from 'react';
import type { ProjectResponse } from '@sentry-guardian/types';
import { Button, Card, Input } from '../components/ui.js';
import { usePageHeader } from '../layout/PageHeaderContext.js';
import { useAuth } from '../lib/auth.js';

export function ProjectsPage() {
  const { api } = useAuth();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  usePageHeader({ title: '项目', description: '管理项目与接入 DSN' });

  function reload() {
    void api.listProjects().then(setProjects);
  }

  useEffect(() => {
    reload();
  }, [api]);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createProject({ name });
      setName('');
      setMessage('项目已创建');
      reload();
    } catch {
      setMessage('创建失败');
    }
  }

  async function rotateKey(id: string) {
    try {
      const res = await api.rotateKey(id);
      setMessage(`DSN 已轮换`);
      void navigator.clipboard.writeText(res.dsn);
      reload();
    } catch {
      setMessage('轮换失败');
    }
  }

  return (
    <div className="space-y-3">
      {message && (
        <p className="text-xs" style={{ color: 'var(--sg-accent)' }}>
          {message}
        </p>
      )}
      <Card>
        <h2 className="mb-2 text-sm font-semibold">新建项目</h2>
        <form className="flex gap-2" onSubmit={(e) => void createProject(e)}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="项目名称" />
          <Button type="submit" variant="primary" size="sm">
            创建
          </Button>
        </form>
      </Card>
      <Card>
        <h2 className="mb-2 text-sm font-semibold">已有项目</h2>
        <ul className="space-y-2 text-xs">
          {projects.map((p) => (
            <li key={p.id} className="border-b border-[var(--sg-border)] pb-2 last:border-0">
              <p className="font-medium">{p.name}</p>
              <p className="mt-0.5 truncate font-mono text-[11px] text-[var(--sg-text-muted)]">
                {p.dsn}
              </p>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="mt-1.5"
                onClick={() => void rotateKey(p.id)}
              >
                轮换 Key
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
