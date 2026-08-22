import type { Env } from './db';

export type AuditInput = {
  userId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
};

/** Records an immutable audit trail entry. Never throws — logging failures must not break requests. */
export async function logAudit(db: Env['DB'], input: AuditInput): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        input.userId,
        input.action,
        input.entityType,
        input.entityId ?? null,
        input.details ? JSON.stringify(input.details) : null,
      )
      .run();
  } catch (err) {
    console.error('Failed to write audit log', err);
  }
}
