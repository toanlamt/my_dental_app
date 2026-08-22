import type { Env } from '../lib/db';
import type { PublicUser } from '../lib/types';

export type Notification = {
  id: string;
  type: string;
  message: string;
  created_at: string;
};

type DoctorFeedRow = {
  id: string;
  status: string;
  start_at: string;
  created_at: string;
  patient_name: string;
};

type AuditFeedRow = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
};

/**
 * Notifications are derived read-only views over appointments/audit_logs
 * (no dedicated table) to keep the schema minimal for the MVP.
 */
export async function getNotificationsForUser(db: Env['DB'], user: PublicUser): Promise<Notification[]> {
  if (user.role === 'doctor') {
    const { results } = await db
      .prepare(
        `SELECT a.id as id, a.status as status, a.start_at as start_at, a.created_at as created_at,
                p.full_name as patient_name
         FROM appointments a JOIN patients p ON p.id = a.patient_id
         WHERE a.doctor_id = ? AND a.created_at >= datetime('now', '-3 days')
         ORDER BY a.created_at DESC LIMIT 20`,
      )
      .bind(user.id)
      .all<DoctorFeedRow>();

    return results.map((row) => ({
      id: row.id,
      type: row.status === 'cancelled' ? 'appointment_cancelled' : 'appointment_scheduled',
      message:
        row.status === 'cancelled'
          ? `Appointment with ${row.patient_name} was cancelled`
          : `Appointment with ${row.patient_name} on ${row.start_at.slice(0, 16).replace('T', ' ')}`,
      created_at: row.created_at,
    }));
  }

  const { results } = await db
    .prepare(
      `SELECT id, action, entity_type, entity_id, created_at FROM audit_logs
       ORDER BY created_at DESC LIMIT 20`,
    )
    .all<AuditFeedRow>();

  return results.map((row) => ({
    id: row.id,
    type: row.action,
    message: describeAuditAction(row),
    created_at: row.created_at,
  }));
}

function describeAuditAction(row: AuditFeedRow): string {
  switch (row.action) {
    case 'patient.created':
      return 'A new patient was registered';
    case 'patient.updated':
      return 'Patient details were updated';
    case 'patient_note.created':
      return 'A new patient note was added';
    case 'appointment.created':
      return 'A new appointment was scheduled';
    case 'appointment.updated':
      return 'An appointment was updated';
    case 'appointment.cancelled':
      return 'An appointment was cancelled';
    case 'user.created':
      return 'A new staff account was created';
    default:
      return `${row.action} (${row.entity_type})`;
  }
}
