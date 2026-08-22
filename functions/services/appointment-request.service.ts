import type { Env } from '../lib/db';
import type { AppointmentRequest, AppointmentRequestStatus } from '../lib/types';

export type CreateAppointmentRequestInput = {
  full_name: string;
  phone: string;
  email?: string | null;
  service_slug?: string | null;
  doctor_id?: string | null;
  preferred_date: string;
  preferred_time: string;
  message?: string | null;
};

export async function createAppointmentRequest(db: Env['DB'], input: CreateAppointmentRequestInput): Promise<AppointmentRequest> {
  const recent = await db.prepare(
    `SELECT id FROM appointment_requests
     WHERE phone = ? AND preferred_date = ? AND preferred_time = ?
     AND created_at >= datetime('now', '-10 minutes') LIMIT 1`,
  ).bind(input.phone, input.preferred_date, input.preferred_time).first<{ id: string }>();
  if (recent) throw new Error('DUPLICATE_REQUEST');

  const id = crypto.randomUUID();
  await db.prepare(
    `INSERT INTO appointment_requests
      (id, full_name, phone, email, service_slug, doctor_id, preferred_date, preferred_time, message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(id, input.full_name, input.phone, input.email ?? null, input.service_slug ?? null, input.doctor_id ?? null, input.preferred_date, input.preferred_time, input.message ?? null).run();
  return (await getAppointmentRequestById(db, id))!;
}

export async function getAppointmentRequestById(db: Env['DB'], id: string): Promise<AppointmentRequest | null> {
  return db.prepare(
    `SELECT r.*, u.full_name as doctor_name
     FROM appointment_requests r LEFT JOIN users u ON u.id = r.doctor_id
     WHERE r.id = ?`,
  ).bind(id).first<AppointmentRequest>();
}

export type ListAppointmentRequestsParams = { status?: AppointmentRequestStatus; date?: string; query?: string };

export async function listAppointmentRequests(db: Env['DB'], params: ListAppointmentRequestsParams): Promise<AppointmentRequest[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (params.status) { conditions.push('r.status = ?'); values.push(params.status); }
  if (params.date) { conditions.push('r.preferred_date = ?'); values.push(params.date); }
  if (params.query?.trim()) { conditions.push('(r.full_name LIKE ? OR r.phone LIKE ?)'); const like = `%${params.query.trim()}%`; values.push(like, like); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { results } = await db.prepare(
    `SELECT r.*, u.full_name as doctor_name
     FROM appointment_requests r LEFT JOIN users u ON u.id = r.doctor_id
     ${where} ORDER BY r.created_at DESC`,
  ).bind(...values).all<AppointmentRequest>();
  return results;
}

export async function reviewAppointmentRequest(db: Env['DB'], id: string, status: 'approved' | 'rejected', reviewedBy: string, rejectionReason?: string | null): Promise<AppointmentRequest | null> {
  const existing = await getAppointmentRequestById(db, id);
  if (!existing || existing.status === 'converted') return null;
  await db.prepare(
    `UPDATE appointment_requests SET status = ?, rejection_reason = ?, reviewed_at = datetime('now'), reviewed_by = ? WHERE id = ?`,
  ).bind(status, status === 'rejected' ? rejectionReason ?? null : null, reviewedBy, id).run();
  return getAppointmentRequestById(db, id);
}

export async function markAppointmentRequestConverted(db: Env['DB'], id: string, appointmentId: string, reviewedBy: string): Promise<AppointmentRequest | null> {
  await db.prepare(
    `UPDATE appointment_requests SET status = 'converted', converted_appointment_id = ?, reviewed_at = datetime('now'), reviewed_by = ? WHERE id = ?`,
  ).bind(appointmentId, reviewedBy, id).run();
  return getAppointmentRequestById(db, id);
}