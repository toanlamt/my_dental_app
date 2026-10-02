import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { Context, MiddlewareHandler } from 'hono';
import type { Env } from './db';
import type { Role, User } from './types';
import { findUserById } from '../services/user.service';

const SESSION_COOKIE = 'session';
const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours

export async function createSession(c: Context<{ Bindings: Env; Variables: AuthVariables }>, user: Pick<User, 'id' | 'role'>) {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  
  await c.env.DB.prepare(
    `INSERT INTO user_sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`
  ).bind(sessionId, user.id, token, expiresAt).run();

  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSession(c: Context<{ Bindings: Env; Variables: AuthVariables }>) {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) {
    await c.env.DB.prepare(`DELETE FROM user_sessions WHERE token = ?`).bind(token).run();
  }
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}

export type AuthVariables = {
  user: User;
};

/** Verifies the session cookie and loads the current user record fresh from the database. */
export const requireAuth: MiddlewareHandler<{ Bindings: Env; Variables: AuthVariables }> = async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return c.json({ error: 'Not authenticated' }, 401);

  const session = await c.env.DB.prepare(
    `SELECT user_id, expires_at FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`
  ).bind(token).first<{ user_id: string; expires_at: string }>();

  if (!session) {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }

  const user = await findUserById(c.env.DB, session.user_id);
  if (!user || !user.is_active) return c.json({ error: 'Not authenticated' }, 401);

  c.set('user', user);
  await next();
};

/** Restricts a route to specific roles. Must run after requireAuth. */
export function requireRole(...roles: Role[]): MiddlewareHandler<{ Bindings: Env; Variables: AuthVariables }> {
  return async (c, next) => {
    const user = c.get('user');
    if (!roles.includes(user.role)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    await next();
  };
}
