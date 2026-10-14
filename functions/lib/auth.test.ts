import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import { requireAuth, requireRole, createSession, clearSession, cleanupExpiredSessions, type AuthVariables } from './auth';
import type { Env } from './db';
import type { User } from './types';

function createMockDb() {
  const preparedStatements: Array<{ query: string; bindArgs: any[]; firstResult: any; runResult: any }> = [];

  const db = {
    prepare: vi.fn((query: string) => {
      let currentBindArgs: any[] = [];
      const stmt = {
        bind: vi.fn((...args: any[]) => {
          currentBindArgs = args;
          return stmt;
        }),
        first: vi.fn().mockImplementation(async () => {
          preparedStatements.push({ query, bindArgs: currentBindArgs, firstResult: null, runResult: null });
          return null;
        }),
        all: vi.fn().mockImplementation(async () => {
          return { results: [] };
        }),
        run: vi.fn().mockImplementation(async () => {
          preparedStatements.push({ query, bindArgs: currentBindArgs, firstResult: null, runResult: { success: true } });
          return { success: true };
        }),
      };
      return stmt;
    }),
    _statements: preparedStatements,
  };

  return db as unknown as Env['DB'] & { prepare: any; _statements: typeof preparedStatements };
}

describe('Authentication & Session Middleware', () => {
  const mockUser: User = {
    id: 'user-123',
    username: 'staff@clinic.local',
    password_hash: 'pbkdf2$100000$salt$hash',
    full_name: 'Clinic Staff',
    role: 'staff',
    is_active: 1,
    created_at: '2026-01-01 00:00:00',
    updated_at: '2026-01-01 00:00:00',
  };

  describe('requireAuth', () => {
    it('returns 401 when no session cookie is present', async () => {
      const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
      app.use('*', requireAuth);
      app.get('/private', (c) => c.json({ success: true }));

      const mockDb = createMockDb();
      const res = await app.request('/private', {}, { DB: mockDb });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ error: 'Not authenticated' });
    });

    it('returns 401 when session token is invalid or expired in database', async () => {
      const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
      app.use('*', requireAuth);
      app.get('/private', (c) => c.json({ success: true }));

      const mockDb = createMockDb();
      // DB statement for session lookup returns null (expired or not found)
      const stmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };
      mockDb.prepare = vi.fn().mockReturnValue(stmt);

      const res = await app.request(
        '/private',
        { headers: { Cookie: 'session=expired-or-invalid-token' } },
        { DB: mockDb },
      );

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ error: 'Invalid or expired session' });
      // Verify query specifically enforces datetime(expires_at) > datetime('now')
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('datetime(expires_at) > datetime(\'now\')'),
      );
    });

    it('returns 401 when user is inactive', async () => {
      const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
      app.use('*', requireAuth);
      app.get('/private', (c) => c.json({ success: true }));

      const mockDb = createMockDb();
      const sessionStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ user_id: 'user-123', expires_at: '2026-10-15T00:00:00.000Z' }),
      };
      const userStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ ...mockUser, is_active: 0 }),
      };

      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('user_sessions')) return sessionStmt;
        return userStmt;
      });

      const res = await app.request(
        '/private',
        { headers: { Cookie: 'session=valid-token' } },
        { DB: mockDb },
      );

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ error: 'Not authenticated' });
    });

    it('authenticates active user with valid session and passes to handler', async () => {
      const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
      app.use('*', requireAuth);
      app.get('/private', (c) => c.json({ user: c.get('user') }));

      const mockDb = createMockDb();
      const sessionStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ user_id: 'user-123', expires_at: '2026-10-15T00:00:00.000Z' }),
      };
      const userStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      };

      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('user_sessions')) return sessionStmt;
        return userStmt;
      });

      const res = await app.request(
        '/private',
        { headers: { Cookie: 'session=valid-token' } },
        { DB: mockDb },
      );

      expect(res.status).toBe(200);
      const data = (await res.json()) as { user: User };
      expect(data.user.id).toBe('user-123');
      expect(data.user.username).toBe('staff@clinic.local');
    });
  });

  describe('requireRole', () => {
    it('returns 403 when user does not have required role', async () => {
      const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
      app.use('*', async (c, next) => {
        c.set('user', mockUser); // role is 'staff'
        await next();
      });
      app.get('/admin-only', requireRole('admin'), (c) => c.json({ ok: true }));

      const res = await app.request('/admin-only');
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data).toEqual({ error: 'Forbidden' });
    });

    it('allows access when user role matches', async () => {
      const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
      app.use('*', async (c, next) => {
        c.set('user', mockUser); // role is 'staff'
        await next();
      });
      app.get('/staff-route', requireRole('staff', 'admin'), (c) => c.json({ ok: true }));

      const res = await app.request('/staff-route');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ ok: true });
    });
  });

  describe('createSession & clearSession', () => {
    it('creates session and sets httpOnly session cookie', async () => {
      const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
      app.post('/login', async (c) => {
        await createSession(c, mockUser);
        return c.json({ ok: true });
      });

      const mockDb = createMockDb();
      const insertStmt = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true }),
      };
      mockDb.prepare = vi.fn().mockReturnValue(insertStmt);

      const res = await app.request('/login', { method: 'POST' }, { DB: mockDb });
      expect(res.status).toBe(200);
      const setCookieHeader = res.headers.get('set-cookie');
      expect(setCookieHeader).toContain('session=');
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('SameSite=Lax');
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_sessions'),
      );
    });

    it('clears session from database and deletes cookie', async () => {
      const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
      app.post('/logout', async (c) => {
        await clearSession(c);
        return c.json({ ok: true });
      });

      const mockDb = createMockDb();
      const deleteStmt = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true }),
      };
      mockDb.prepare = vi.fn().mockReturnValue(deleteStmt);

      const res = await app.request(
        '/logout',
        { method: 'POST', headers: { Cookie: 'session=test-token' } },
        { DB: mockDb },
      );

      expect(res.status).toBe(200);
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM user_sessions WHERE token = ?'),
      );
      expect(deleteStmt.bind).toHaveBeenCalledWith('test-token');
      const setCookieHeader = res.headers.get('set-cookie');
      expect(setCookieHeader).toContain('Max-Age=0');
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('executes delete query with datetime check', async () => {
      const mockDb = createMockDb();
      const deleteStmt = {
        run: vi.fn().mockResolvedValue({ success: true }),
      };
      mockDb.prepare = vi.fn().mockReturnValue(deleteStmt);

      await cleanupExpiredSessions(mockDb);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM user_sessions WHERE datetime(expires_at) <= datetime(\'now\')'),
      );
      expect(deleteStmt.run).toHaveBeenCalled();
    });
  });
});
