import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type Role = 'admin' | 'doctor' | 'staff';
export type User = { id: string; username: string; email?: string; full_name: string; name: string; role: Role; is_active: number; created_at: string; updated_at: string };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? 'Request failed');
  return body as T;
}

export function apiRequest<T>(url: string, options?: RequestInit) {
  return request<T>(url, options);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request<{ user: User }>('/api/auth/me')
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const result = await request<{ user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    setUser(result.user);
  };

  const logout = async () => {
    await request('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
