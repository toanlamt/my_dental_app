import type { Env } from '../lib/db';
import type { PublicUser, Role, User } from '../lib/types';
import { toPublicUser } from '../lib/types';
import { hashPassword } from '../lib/password';

export async function findUserByUsername(db: Env['DB'], username: string): Promise<User | null> {
  const row = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first<User>();
  return row ?? null;
}

export async function findUserById(db: Env['DB'], id: string): Promise<User | null> {
  const row = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();
  return row ?? null;
}

export async function listDoctors(db: Env['DB']): Promise<PublicUser[]> {
  const { results } = await db
    .prepare(
      `SELECT id, username, full_name, username as email, full_name as name, role, is_active, created_at, updated_at FROM users
       WHERE role = 'doctor' AND is_active = 1 ORDER BY full_name ASC`,
    )
    .all<PublicUser>();
  return results;
}

export type CreateUserInput = {
  username: string;
  password: string;
  full_name: string;
  role: Role;
};

export async function createUser(db: Env['DB'], input: CreateUserInput): Promise<PublicUser> {
  const existing = await findUserByUsername(db, input.username);
  if (existing) {
    throw new Error('USERNAME_TAKEN');
  }
  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(input.password);
  await db
    .prepare('INSERT INTO users (id, username, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)')
    .bind(id, input.username, passwordHash, input.full_name, input.role)
    .run();
  const user = await findUserById(db, id);
  return toPublicUser(user!);
}
