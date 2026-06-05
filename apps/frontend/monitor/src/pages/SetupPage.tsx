import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '../components/ui.js';
import { ApiClient } from '../lib/api.js';

export function SetupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    organization_name: 'My Organization',
    admin_email: 'admin@localhost',
    admin_password: 'adminadmin',
    project_name: 'Default Project',
  });
  const [dsn, setDsn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await new ApiClient().setup(form);
      setDsn(res.dsn);
    } catch {
      setError('引导失败');
    }
  }

  if (dsn) {
    return (
      <div className="mx-auto max-w-md p-6">
        <Card>
          <h1 className="text-xl font-semibold">部署完成</h1>
          <p className="mt-2 break-all text-sm text-zinc-400">DSN: {dsn}</p>
          <Button type="button" className="mt-4" onClick={() => navigate('/login')}>
            前往登录
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <Card>
        <h1 className="mb-4 text-xl font-semibold">首次部署引导</h1>
        <form className="space-y-3" onSubmit={(e) => void submit(e)}>
          {(['organization_name', 'admin_email', 'admin_password', 'project_name'] as const).map(
            (key) => (
              <label key={key} className="block text-sm text-zinc-400">
                {key}
                <Input
                  className="mt-1"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ),
          )}
          {error && <p className="text-red-400">{error}</p>}
          <Button type="submit">创建实例</Button>
        </form>
      </Card>
    </div>
  );
}
