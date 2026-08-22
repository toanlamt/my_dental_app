import type { Env } from '../lib/db';
import type { Patient, PatientNote } from '../lib/types';

function withLegacyFields(patient: Patient): Patient {
  return { ...patient, dob: patient.date_of_birth };
}

export type ListPatientsParams = {
  query?: string;
  page: number;
  pageSize: number;
};

export type ListPatientsResult = {
  patients: Patient[];
  total: number;
  page: number;
  pageSize: number;
};

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

export async function listPatients(db: Env['DB'], params: ListPatientsParams): Promise<ListPatientsResult> {
  const offset = (params.page - 1) * params.pageSize;
  const search = params.query?.trim();

  if (search) {
    const like = `%${escapeLike(search)}%`;
    const [rows, count] = await Promise.all([
      db
        .prepare(
          `SELECT * FROM patients
           WHERE full_name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\'
           ORDER BY full_name ASC LIMIT ? OFFSET ?`,
        )
        .bind(like, like, params.pageSize, offset)
        .all<Patient>(),
      db
        .prepare(
          `SELECT COUNT(*) as count FROM patients
           WHERE full_name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\'`,
        )
        .bind(like, like)
        .first<{ count: number }>(),
    ]);
    const patients = rows.results.map(withLegacyFields);
    if (patients.length > 0) {
      const ids = patients.map((patient) => patient.id);
      const placeholders = ids.map(() => '?').join(',');
      const latest = await db.prepare(
        `SELECT patient_id, MAX(start_at) as latest_appointment FROM appointments
         WHERE patient_id IN (${placeholders}) AND status != 'cancelled' GROUP BY patient_id`,
      ).bind(...ids).all<{ patient_id: string; latest_appointment: string }>();
      const byPatient = new Map(latest.results.map((row) => [row.patient_id, row.latest_appointment]));
      patients.forEach((patient) => Object.assign(patient, { latest_appointment: byPatient.get(patient.id) ?? null }));
    }
    return { patients, total: count?.count ?? 0, page: params.page, pageSize: params.pageSize };
  }

  const [rows, count] = await Promise.all([
    db
      .prepare('SELECT * FROM patients ORDER BY full_name ASC LIMIT ? OFFSET ?')
      .bind(params.pageSize, offset)
      .all<Patient>(),
    db.prepare('SELECT COUNT(*) as count FROM patients').first<{ count: number }>(),
  ]);
  return { patients: rows.results.map(withLegacyFields), total: count?.count ?? 0, page: params.page, pageSize: params.pageSize };
}

export async function getPatientById(db: Env['DB'], id: string): Promise<Patient | null> {
  const row = await db.prepare('SELECT * FROM patients WHERE id = ?').bind(id).first<Patient>();
  return row ? withLegacyFields(row) : null;
}

export type CreatePatientInput = {
  full_name: string;
  date_of_birth?: string | null;
  gender?: Patient['gender'];
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  medical_notes?: string | null;
};

export async function createPatient(db: Env['DB'], input: CreatePatientInput): Promise<Patient> {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO patients (id, full_name, date_of_birth, gender, phone, email, address, medical_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.full_name,
      input.date_of_birth ?? null,
      input.gender ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.address ?? null,
      input.medical_notes ?? null,
    )
    .run();
  const patient = await getPatientById(db, id);
  return patient!;
}

export type UpdatePatientInput = Partial<Omit<CreatePatientInput, 'createdBy'>>;

export async function updatePatient(db: Env['DB'], id: string, input: UpdatePatientInput): Promise<Patient | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(input)) {
    fields.push(`${key} = ?`);
    values.push(value ?? null);
  }
  if (fields.length === 0) {
    return getPatientById(db, id);
  }
  fields.push("updated_at = datetime('now')");
  values.push(id);
  await db
    .prepare(`UPDATE patients SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();
  return getPatientById(db, id);
}

export async function listPatientNotes(db: Env['DB'], patientId: string): Promise<PatientNote[]> {
  const { results } = await db
    .prepare('SELECT * FROM patient_notes WHERE patient_id = ? ORDER BY created_at DESC')
    .bind(patientId)
    .all<PatientNote>();
  return results;
}

export type AddPatientNoteInput = {
  patientId: string;
  authorId: string;
  note: string;
};

export async function addPatientNote(db: Env['DB'], input: AddPatientNoteInput): Promise<PatientNote> {
  const id = crypto.randomUUID();
  await db
    .prepare('INSERT INTO patient_notes (id, patient_id, author_id, note) VALUES (?, ?, ?, ?)')
    .bind(id, input.patientId, input.authorId, input.note)
    .run();
  const note = await db.prepare('SELECT * FROM patient_notes WHERE id = ?').bind(id).first<PatientNote>();
  return note!;
}
