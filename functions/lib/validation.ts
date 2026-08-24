import { z } from 'zod';
import type { Context } from 'hono';

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

export const genderSchema = z.enum(['male', 'female', 'other']);

const patientFieldsSchema = z.object({
  full_name: z.string().trim().min(1).max(200),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date_of_birth must be YYYY-MM-DD')
    .optional()
    .nullable(),
  gender: genderSchema.optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  medical_notes: z.string().trim().max(4000).optional().nullable(),
});

export const createPatientSchema = z.preprocess((value) => {
  if (!value || typeof value !== 'object') return value;
  const input = value as Record<string, unknown>;
  return { ...input, date_of_birth: input.date_of_birth ?? input.dob };
}, patientFieldsSchema);

export const updatePatientSchema = z.preprocess((value) => {
  if (!value || typeof value !== 'object') return value;
  const input = value as Record<string, unknown>;
  return { ...input, date_of_birth: input.date_of_birth ?? input.dob };
}, patientFieldsSchema.partial());

export const createNoteSchema = z.object({
  note: z.string().trim().min(1).max(4000),
});

const medicalRecordFieldsSchema = z.object({
  appointment_id: z.string().uuid().optional().nullable(),
  record_date: z.string().datetime(),
  reason: z.string().trim().min(1).max(500),
  examination: z.string().trim().max(4000).optional().nullable(),
  diagnosis: z.string().trim().max(4000).optional().nullable(),
  treatment: z.string().trim().max(4000).optional().nullable(),
  clinical_notes: z.string().trim().max(4000).optional().nullable(),
  follow_up: z.string().trim().max(2000).optional().nullable(),
  follow_up_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'follow_up_date must be YYYY-MM-DD').refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), 'follow_up_date must be a valid date').optional().nullable(),
});

export const createMedicalRecordSchema = medicalRecordFieldsSchema;
export const updateMedicalRecordSchema = medicalRecordFieldsSchema.partial();

export const roleSchema = z.enum(['admin', 'doctor', 'staff']);

export const createUserSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(8).max(200),
  full_name: z.string().trim().min(1).max(200),
  role: roleSchema,
});

const appointmentFieldsSchema = z.object({
  patient_id: z.string().uuid(),
  doctor_id: z.string().uuid(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  reason: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(4000).optional().nullable(),
});

export const createAppointmentSchema = z.preprocess((value) => {
  if (!value || typeof value !== 'object') return value;
  const input = value as Record<string, unknown>;
  return { ...input, start_at: input.start_at ?? input.start_time, end_at: input.end_at ?? input.end_time };
}, appointmentFieldsSchema);

export const updateAppointmentSchema = z.object({
  doctor_id: z.string().uuid().optional(),
  start_at: z.string().datetime().optional(),
  end_at: z.string().datetime().optional(),
  reason: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(4000).optional().nullable(),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
});

const publicServiceSlugs = ['general-dentistry', 'dental-cleaning', 'teeth-whitening', 'dental-implants', 'orthodontics', 'childrens-dentistry'] as const;

export const createAppointmentRequestSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required').max(200),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,30}$/, 'Valid phone is required'),
  email: z.string().trim().email().max(200).optional().nullable(),
  service_slug: z.enum(publicServiceSlugs).optional().nullable(),
  doctor_id: z.string().uuid().optional().nullable(),
  preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date is required').refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), 'Valid date is required'),
  preferred_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Valid time is required'),
  message: z.string().trim().max(1000).optional().nullable(),
});

export const reviewAppointmentRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejection_reason: z.string().trim().max(500).optional().nullable(),
});

export const convertAppointmentRequestSchema = z.object({
  patient_id: z.string().uuid().optional(),
  doctor_id: z.string().uuid().optional(),
});

/** Parses and validates a JSON request body. Returns either the typed data or an error Response to return as-is. */
export async function parseJsonBody<T>(c: Context, schema: z.ZodType<T>): Promise<T | Response> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
  }
  return result.data;
}
