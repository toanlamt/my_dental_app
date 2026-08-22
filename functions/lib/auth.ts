import { jwtVerify, SignJWT } from 'jose';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { Context, MiddlewareHandler } from 'hono';
import type { Env } from './db';
import type { Role, User } from './types';
import { findUserById } from '../services/user.service';

const SESSION_COOKIE = 'session';
const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours

type SessionPayload = {
  sub: string;
  role: Role;
  exp: number;
};

export async function createSession(c: Context<{ Bindings: Env; Variables: AuthVariables }>, user: Pick<User, 'id' | 'role'>) {
  const payload: SessionPayload = {
    sub: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const token = await new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setExpirationTime(payload.exp)
    .sign(new TextEncoder().encode(c.env.JWT_SECRET));
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSession(c: Context<{ Bindings: Env; Variables: AuthVariables }>) {
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}

export type AuthVariables = {
  user: User;
};

/** Verifies the session cookie and loads the current user record fresh from the database. */
export const requireAuth: MiddlewareHandler<{ Bindings: Env; Variables: AuthVariables }> = async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return c.json({ error: 'Not authenticated' }, 401);

  let payload: SessionPayload;
  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(c.env.JWT_SECRET));
    payload = {
      sub: verified.payload.sub ?? '',
      role: verified.payload.role as Role,
      exp: verified.payload.exp ?? 0,
    };
  } catch {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }

  const user = await findUserById(c.env.DB, payload.sub);
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
