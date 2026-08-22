import type { Env } from '../lib/db';
import type { Appointment, AppointmentStatus } from '../lib/types';

function withLegacyFields(appointment: Appointment): Appointment {
  return { ...appointment, start_time: appointment.start_at, end_time: appointment.end_at };
}

export type ListAppointmentsParams = {
  from?: string;
  to?: string;
  doctorId?: string;
  status?: AppointmentStatus;
};

export async function listAppointments(db: Env['DB'], params: ListAppointmentsParams): Promise<Appointment[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.from) {
    conditions.push('start_at >= ?');
    values.push(params.from);
  }
  if (params.to) {
    conditions.push('start_at <= ?');
    values.push(params.to);
  }
  if (params.doctorId) {
    conditions.push('doctor_id = ?');
    values.push(params.doctorId);
  }
  if (params.status) {
    conditions.push('status = ?');
    values.push(params.status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { results } = await db
    .prepare(`SELECT * FROM appointments ${where} ORDER BY start_at ASC`)
    .bind(...values)
    .all<Appointment>();
  return results.map(withLegacyFields);
}

export async function getAppointmentById(db: Env['DB'], id: string): Promise<Appointment | null> {
  const row = await db.prepare('SELECT * FROM appointments WHERE id = ?').bind(id).first<Appointment>();
  return row ? withLegacyFields(row) : null;
}

async function hasConflict(
  db: Env['DB'],
  doctorId: string,
  startTime: string,
  endTime: string,
  excludeId?: string,
): Promise<boolean> {
  const query = excludeId
    ? `SELECT id FROM appointments WHERE doctor_id = ? AND status != 'cancelled' AND id != ?
       AND start_at < ? AND end_at > ? LIMIT 1`
    : `SELECT id FROM appointments WHERE doctor_id = ? AND status != 'cancelled'
       AND start_at < ? AND end_at > ? LIMIT 1`;
  const bindValues = excludeId
    ? [doctorId, excludeId, endTime, startTime]
    : [doctorId, endTime, startTime];
  const row = await db.prepare(query).bind(...bindValues).first();
  return row != null;
}

export type CreateAppointmentInput = {
  patientId: string;
  doctorId: string;
  startTime: string;
  endTime: string;
  reason?: string | null;
  createdBy: string;
  notes?: string | null;
};

export class AppointmentConflictError extends Error {
  constructor() {
    super('DOCTOR_TIME_CONFLICT');
  }
}

export async function createAppointment(db: Env['DB'], input: CreateAppointmentInput): Promise<Appointment> {
  if (await hasConflict(db, input.doctorId, input.startTime, input.endTime)) {
    throw new AppointmentConflictError();
  }
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO appointments (id, patient_id, doctor_id, start_at, end_at, reason, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, input.patientId, input.doctorId, input.startTime, input.endTime, input.reason ?? null, input.notes ?? null)
    .run();
  const appointment = await getAppointmentById(db, id);
  return appointment!;
}

export type UpdateAppointmentInput = {
  doctorId?: string;
  startTime?: string;
  endTime?: string;
  reason?: string | null;
  status?: AppointmentStatus;
  notes?: string | null;
};

export async function updateAppointment(
  db: Env['DB'],
  id: string,
  input: UpdateAppointmentInput,
): Promise<Appointment | null> {
  const current = await getAppointmentById(db, id);
  if (!current) return null;

  const nextDoctorId = input.doctorId ?? current.doctor_id;
  const nextStart = input.startTime ?? current.start_at;
  const nextEnd = input.endTime ?? current.end_at;
  const isRescheduling = input.doctorId || input.startTime || input.endTime;

  if (isRescheduling && (await hasConflict(db, nextDoctorId, nextStart, nextEnd, id))) {
    throw new AppointmentConflictError();
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  const columnMap: Record<string, unknown> = {
    doctor_id: input.doctorId,
    start_at: input.startTime,
    end_at: input.endTime,
    reason: input.reason,
    notes: input.notes,
    status: input.status,
  };
  for (const [column, value] of Object.entries(columnMap)) {
    if (value !== undefined) {
      fields.push(`${column} = ?`);
      values.push(value);
    }
  }
  if (fields.length === 0) return current;

  fields.push("updated_at = datetime('now')");
  values.push(id);
  await db
    .prepare(`UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();
  return getAppointmentById(db, id);
}
