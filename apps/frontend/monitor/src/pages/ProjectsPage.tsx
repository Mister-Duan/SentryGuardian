import { useEffect, useState } from 'react';
import type { ProjectResponse } from '@sentry-guardian/types';
import { Button, Card, Input } from '../components/ui.js';
import { useAuth } from '../lib/auth.js';

export function ProjectsPage() {
  const { api } = useAuth();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState<string | null>(null);

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
      setMessage(`DSN 已轮换: ${res.dsn}`);
      reload();
    } catch {
      setMessage('轮换失败');
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">项目设置</h1>
      {message && <p className="mb-4 text-sm text-sky-400">{message}</p>}
      <Card>
        <h2 className="mb-3 font-medium">新建项目</h2>
        <form className="flex gap-2" onSubmit={(e) => void createProject(e)}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="项目名称" />
          <Button type="submit">创建</Button>
        </form>
      </Card>
      <Card>
        <h2 className="mb-3 font-medium">已有项目</h2>
        <ul className="space-y-4 text-sm">
          {projects.map((p) => (
            <li key={p.id} className="border-b border-zinc-800 pb-3">
              <p className="font-medium">{p.name}</p>
              <p className="break-all text-xs text-zinc-500">{p.dsn}</p>
              <Button
                type="button"
                className="mt-2 bg-zinc-800 text-zinc-100"
                onClick={() => void rotateKey(p.id)}
              >
                轮换 DSN Key
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
