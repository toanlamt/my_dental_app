import type { Env } from '../lib/db';
import type { Notification, NotificationEntityType, NotificationType } from '../lib/types';

const RETENTION_DAYS = 90;

type NotificationMetadata = Record<string, unknown> | null;

export type NotificationListParams = {
  page: number;
  pageSize: number;
  unreadOnly?: boolean;
};

export type NotificationListResult = {
  notifications: Array<Omit<Notification, 'metadata'> & { metadata: NotificationMetadata }>;
  total: number;
  unread: number;
  page: number;
  pageSize: number;
};

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  entityType?: NotificationEntityType | null;
  entityId?: string | null;
  metadata?: NotificationMetadata;
  dedupeKey?: string | null;
};

function parseMetadata(raw: string | null): NotificationMetadata {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    return null;
  } catch {
    return null;
  }
}

async function cleanupOldNotifications(db: Env['DB']): Promise<void> {
  try {
    await db
      .prepare(`DELETE FROM notifications WHERE created_at < datetime('now', '-${RETENTION_DAYS} days')`)
      .run();
  } catch (err) {
    console.error('Failed to cleanup old notifications', err);
  }
}

export async function createNotification(db: Env['DB'], input: CreateNotificationInput): Promise<void> {
  await db
    .prepare(
      `INSERT OR IGNORE INTO notifications (id, user_id, type, entity_type, entity_id, metadata, dedupe_key)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      input.userId,
      input.type,
      input.entityType ?? null,
      input.entityId ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
      input.dedupeKey ?? null,
    )
    .run();

  void cleanupOldNotifications(db);
}

export async function createNotifications(db: Env['DB'], inputs: CreateNotificationInput[]): Promise<void> {
  for (const input of inputs) {
    await createNotification(db, input);
  }
}

export async function listNotificationsForUser(
  db: Env['DB'],
  userId: string,
  params: NotificationListParams,
): Promise<NotificationListResult> {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const offset = (page - 1) * pageSize;
  const unreadClause = params.unreadOnly ? " AND read_at IS NULL" : '';

  const { results } = await db
    .prepare(
      `SELECT id, user_id, type, entity_type, entity_id, metadata, read_at, created_at, dedupe_key
       FROM notifications
       WHERE user_id = ?${unreadClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .bind(userId, pageSize, offset)
    .all<Notification>();

  const totalRow = await db
    .prepare(`SELECT COUNT(*) as count FROM notifications WHERE user_id = ?${unreadClause}`)
    .bind(userId)
    .first<{ count: number }>();
  const unreadRow = await db
    .prepare(`SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_at IS NULL`)
    .bind(userId)
    .first<{ count: number }>();

  return {
    notifications: results.map((item) => ({ ...item, metadata: parseMetadata(item.metadata) })),
    total: totalRow?.count ?? 0,
    unread: unreadRow?.count ?? 0,
    page,
    pageSize,
  };
}

export async function getUnreadCount(db: Env['DB'], userId: string): Promise<number> {
  const row = await db
    .prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_at IS NULL')
    .bind(userId)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

export async function markNotificationAsRead(db: Env['DB'], userId: string, notificationId: string): Promise<boolean> {
  const existing = await db
    .prepare('SELECT id FROM notifications WHERE id = ? AND user_id = ?')
    .bind(notificationId, userId)
    .first<{ id: string }>();
  if (!existing) return false;

  await db
    .prepare("UPDATE notifications SET read_at = datetime('now') WHERE id = ? AND user_id = ? AND read_at IS NULL")
    .bind(notificationId, userId)
    .run();
  return true;
}

export async function markAllNotificationsAsRead(db: Env['DB'], userId: string): Promise<number> {
  const result = await db
    .prepare("UPDATE notifications SET read_at = datetime('now') WHERE user_id = ? AND read_at IS NULL")
    .bind(userId)
    .run();
  return result.meta.changes ?? 0;
}
