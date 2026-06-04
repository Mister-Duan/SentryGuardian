import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiClient } from './api.js';

const TOKEN_KEY = 'sg_token';

interface AuthContextValue {
  token: string | null;
  api: ApiClient;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Auth provider storing JWT in localStorage.
 * 在 localStorage 中保存 JWT 的认证 Provider。
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  const api = useMemo(() => new ApiClient(token ?? undefined), [token]);

  const login = useCallback(
    async (email: string, password: string) => {
      const client = new ApiClient();
      const res = await client.login({ email, password });
      localStorage.setItem(TOKEN_KEY, res.access_token);
      setToken(res.access_token);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({ token, api, login, logout }),
    [token, api, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
