import type { Env } from '../lib/db';
import type { MedicalRecord } from '../lib/types';

export type MedicalRecordInput = Partial<Pick<MedicalRecord, 'appointment_id' | 'examination' | 'diagnosis' | 'treatment' | 'clinical_notes' | 'follow_up' | 'follow_up_date'>> & Pick<MedicalRecord, 'record_date' | 'reason'>;

const recordSelect = `SELECT medical_records.*, users.full_name AS author_name,
  appointments.start_at AS appointment_start_at
  FROM medical_records
  JOIN users ON users.id = medical_records.author_id
  LEFT JOIN appointments ON appointments.id = medical_records.appointment_id`;

export async function listMedicalRecords(
  db: Env['DB'],
  patientId: string,
  access: { userId: string; isDoctor: boolean },
  page = 1,
  pageSize = 20,
) {
  const offset = (page - 1) * pageSize;
  const scope = access.isDoctor ? ' AND (medical_records.author_id = ? OR appointments.doctor_id = ?)' : '';
  const values = access.isDoctor ? [patientId, access.userId, access.userId, pageSize, offset] : [patientId, pageSize, offset];
  const rows = await db.prepare(`${recordSelect} WHERE medical_records.patient_id = ?${scope} ORDER BY record_date DESC LIMIT ? OFFSET ?`).bind(...values).all<MedicalRecord>();
  const countValues = access.isDoctor ? [patientId, access.userId, access.userId] : [patientId];
  const count = await db.prepare(`SELECT COUNT(*) AS count FROM medical_records LEFT JOIN appointments ON appointments.id = medical_records.appointment_id WHERE medical_records.patient_id = ?${scope}`).bind(...countValues).first<{ count: number }>();
  return { records: rows.results, total: count?.count ?? 0, page, pageSize };
}

export async function getMedicalRecordById(db: Env['DB'], id: string, access: { userId: string; isDoctor: boolean }): Promise<MedicalRecord | null> {
  const scope = access.isDoctor ? ' AND (medical_records.author_id = ? OR appointments.doctor_id = ?)' : '';
  const values = access.isDoctor ? [id, access.userId, access.userId] : [id];
  return db.prepare(`${recordSelect} WHERE medical_records.id = ?${scope}`).bind(...values).first<MedicalRecord>();
}

export async function createMedicalRecord(db: Env['DB'], patientId: string, authorId: string, input: MedicalRecordInput): Promise<MedicalRecord> {
  const id = crypto.randomUUID();
  await db.prepare(`INSERT INTO medical_records
    (id, patient_id, appointment_id, author_id, record_date, reason, examination, diagnosis, treatment, clinical_notes, follow_up, follow_up_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, patientId, input.appointment_id ?? null, authorId, input.record_date, input.reason, input.examination ?? null, input.diagnosis ?? null, input.treatment ?? null, input.clinical_notes ?? null, input.follow_up ?? null, input.follow_up_date ?? null).run();
  return (await getMedicalRecordById(db, id, { userId: authorId, isDoctor: false }))!;
}

export async function updateMedicalRecord(db: Env['DB'], id: string, input: Partial<MedicalRecordInput>): Promise<MedicalRecord | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(input)) {
    fields.push(`${key} = ?`);
    values.push(value ?? null);
  }
  if (fields.length === 0) return getMedicalRecordById(db, id, { userId: '', isDoctor: false });
  fields.push("updated_at = datetime('now')");
  values.push(id);
  await db.prepare(`UPDATE medical_records SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  return getMedicalRecordById(db, id, { userId: '', isDoctor: false });
}

export async function getMedicalRecordForAppointment(db: Env['DB'], appointmentId: string, access: { userId: string; isDoctor: boolean }): Promise<MedicalRecord | null> {
  const scope = access.isDoctor ? ' AND (medical_records.author_id = ? OR appointments.doctor_id = ?)' : '';
  const values = access.isDoctor ? [appointmentId, access.userId, access.userId] : [appointmentId];
  return db.prepare(`${recordSelect} WHERE medical_records.appointment_id = ?${scope} ORDER BY record_date DESC LIMIT 1`).bind(...values).first<MedicalRecord>();
}