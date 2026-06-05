import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout.js';
import { Button, Card, Input } from '../components/ui.js';
import { ApiClient } from '../lib/api.js';

const FIELD_LABELS: Record<string, string> = {
  organization_name: '组织名称',
  admin_email: '管理员邮箱',
  admin_password: '管理员密码',
  project_name: '项目名称',
};

export function SetupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    organization_name: '我的组织',
    admin_email: 'admin@localhost',
    admin_password: 'adminadmin',
    project_name: '默认项目',
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
      <AuthLayout>
        <Card>
          <h1 className="text-xl font-semibold text-[var(--sg-text)]">部署完成</h1>
          <p className="mt-2 break-all font-mono text-sm text-[var(--sg-text-muted)]">DSN: {dsn}</p>
          <Button type="button" variant="primary" className="mt-4" onClick={() => navigate('/login')}>
            前往登录
          </Button>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card>
        <h1 className="mb-1 text-xl font-semibold text-[var(--sg-text)]">首次部署引导</h1>
        <p className="mb-4 text-sm text-[var(--sg-text-muted)]">创建组织、管理员与首个项目</p>
        <form className="space-y-3" onSubmit={(e) => void submit(e)}>
          {(['organization_name', 'admin_email', 'admin_password', 'project_name'] as const).map(
            (key) => (
              <label key={key} className="block text-sm text-[var(--sg-text-muted)]">
                {FIELD_LABELS[key]}
                <Input
                  className="mt-1"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ),
          )}
          {error && <p className="text-sm text-[var(--sg-danger)]">{error}</p>}
          <Button type="submit" variant="primary" className="w-full">
            创建实例
          </Button>
        </form>
      </Card>
    </AuthLayout>
  );
}
