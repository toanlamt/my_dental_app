import type { Env } from '../lib/db';
import type { DentalChartEntry, ToothStatus } from '../lib/types';

export type DentalChartInput = { tooth_number: number; status: ToothStatus; notes?: string | null };

const PERMANENT_TEETH = [11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32, 33, 34, 35, 36, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48];

export async function getDentalChart(db: Env['DB'], patientId: string): Promise<DentalChartEntry[]> {
  const entries = await db
    .prepare('SELECT * FROM patient_dental_chart WHERE patient_id = ? ORDER BY tooth_number ASC')
    .bind(patientId)
    .all<DentalChartEntry>();
  
  // Create a map of existing entries
  const entryMap = new Map(entries.results.map((e) => [e.tooth_number, e]));
  
  // Return all permanent teeth, using existing data or defaulting to healthy
  return PERMANENT_TEETH.map((tooth) => {
    const existing = entryMap.get(tooth);
    if (existing) return existing;
    return {
      id: '', // Placeholder for non-persisted entries
      patient_id: patientId,
      tooth_number: tooth,
      status: 'healthy' as const,
      notes: null,
      created_at: '',
      updated_at: '',
      updated_by: null,
    };
  });
}

export async function getDentalChartEntry(db: Env['DB'], patientId: string, toothNumber: number): Promise<DentalChartEntry | null> {
  return db
    .prepare('SELECT * FROM patient_dental_chart WHERE patient_id = ? AND tooth_number = ?')
    .bind(patientId, toothNumber)
    .first<DentalChartEntry>();
}

export async function updateDentalChartEntry(db: Env['DB'], patientId: string, toothNumber: number, input: DentalChartInput, userId: string): Promise<DentalChartEntry> {
  const existing = await getDentalChartEntry(db, patientId, toothNumber);
  
  if (existing) {
    // Update existing entry
    await db
      .prepare("UPDATE patient_dental_chart SET status = ?, notes = ?, updated_at = datetime('now'), updated_by = ? WHERE id = ?")
      .bind(input.status, input.notes ?? null, userId, existing.id)
      .run();
  } else {
    // Create new entry
    const id = crypto.randomUUID();
    await db
      .prepare(
        'INSERT INTO patient_dental_chart (id, patient_id, tooth_number, status, notes, updated_by) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(id, patientId, toothNumber, input.status, input.notes ?? null, userId)
      .run();
  }
  
  return (await getDentalChartEntry(db, patientId, toothNumber))!;
}
