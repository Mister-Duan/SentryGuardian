import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
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
    <div className="mx-auto flex min-h-screen max-w-md items-center p-6">
      <Card>
        <h1 className="mb-4 text-xl font-semibold">SentryGuardian</h1>
        <form className="space-y-3" onSubmit={onSubmit}>
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
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full">
            登录
          </Button>
        </form>
      </Card>
    </div>
  );
}
