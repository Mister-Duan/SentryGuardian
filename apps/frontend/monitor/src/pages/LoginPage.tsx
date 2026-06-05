import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout.js';
import { Button, Card, Input } from '../components/ui.js';
import { useAuth } from '../lib/auth.js';

export function LoginPage() {
  const { token, login } = useAuth();
  const [email, setEmail] = useState('admin@localhost');
  const [password, setPassword] = useState('adminadmin');
  const [error, setError] = useState<string | null>(null);

  if (token) {
    return <Navigate to="/issues" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch {
      setError('登录失败，请检查邮箱与密码');
    }
  }

  return (
    <AuthLayout>
      <Card>
        <h1 className="mb-0.5 text-lg font-semibold">登录</h1>
        <p className="mb-3 text-xs text-[var(--sg-text-muted)]">进入监控控制台</p>
        <form className="space-y-2" onSubmit={onSubmit}>
          <Input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-xs text-[var(--sg-danger)]">{error}</p>}
          <Button type="submit" variant="primary" className="w-full">
            登录
          </Button>
        </form>
      </Card>
    </AuthLayout>
  );
}
