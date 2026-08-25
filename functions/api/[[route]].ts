import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../lib/db';
import { requireAuth, requireRole, createSession, clearSession, type AuthVariables } from '../lib/auth';
import { verifyPassword } from '../lib/password';
import { logAudit } from '../lib/audit';
import {
  loginSchema,
  createPatientSchema,
  updatePatientSchema,
  createNoteSchema,
  createUserSchema,
  createAppointmentSchema,
  createAppointmentRequestSchema,
  reviewAppointmentRequestSchema,
  convertAppointmentRequestSchema,
  updateAppointmentSchema,
  createMedicalRecordSchema,
  updateMedicalRecordSchema,
  updateDentalChartSchema,
  validateDocumentFile,
  parseJsonBody,
} from '../lib/validation';
import { toPublicUser, type AppointmentStatus, type AppointmentRequestStatus, type NotificationType } from '../lib/types';
import * as userService from '../services/user.service';
import * as patientService from '../services/patient.service';
import * as appointmentService from '../services/appointment.service';
import * as notificationService from '../services/notification.service';
import * as appointmentRequestService from '../services/appointment-request.service';
import * as medicalRecordService from '../services/medical-record.service';
import * as dentalChartService from '../services/dental-chart.service';
import * as documentService from '../services/document.service';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>().basePath('/api');

async function createNotificationsSafely(db: Env['DB'], inputs: Array<{
  userId: string;
  type: NotificationType;
  entityType?: 'appointment_request' | 'appointment' | 'patient' | 'system' | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  dedupeKey?: string | null;
}>): Promise<void> {
  try {
    if (inputs.length === 0) return;
    await notificationService.createNotifications(db, inputs);
  } catch (err) {
    console.error('Failed to create notifications', err);
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

app.post('/auth/login', async (c) => {
  const parsed = await parseJsonBody(c, loginSchema);
  if (parsed instanceof Response) return parsed;

  const user = await userService.findUserByUsername(c.env.DB, parsed.username);
  const valid = user ? await verifyPassword(parsed.password, user.password_hash) : false;
  if (!user || !user.is_active || !valid) {
    await logAudit(c.env.DB, {
      userId: null,
      action: 'auth.login_failed',
      entityType: 'user',
      details: { username: parsed.username },
    });
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  await createSession(c, user);
  await logAudit(c.env.DB, { userId: user.id, action: 'auth.login', entityType: 'user', entityId: user.id });
  return c.json({ user: toPublicUser(user) });
});

app.post('/auth/logout', requireAuth, async (c) => {
  const user = c.get('user');
  clearSession(c);
  await logAudit(c.env.DB, { userId: user.id, action: 'auth.logout', entityType: 'user', entityId: user.id });
  return c.json({ ok: true });
});

app.get('/auth/me', requireAuth, async (c) => {
  return c.json({ user: toPublicUser(c.get('user')) });
});

// ---------------------------------------------------------------------------
// Users (admin manages doctor/staff accounts; no public registration)
// ---------------------------------------------------------------------------

app.post('/users', requireAuth, requireRole('admin'), async (c) => {
  const parsed = await parseJsonBody(c, createUserSchema);
  if (parsed instanceof Response) return parsed;

  try {
    const user = await userService.createUser(c.env.DB, parsed);
    await logAudit(c.env.DB, {
      userId: c.get('user').id,
      action: 'user.created',
      entityType: 'user',
      entityId: user.id,
    });
    return c.json({ user }, 201);
  } catch (err) {
    if (err instanceof Error && err.message === 'USERNAME_TAKEN') {
      return c.json({ error: 'Username already in use' }, 409);
    }
    throw err;
  }
});

app.get('/doctors', requireAuth, async (c) => {
  const doctors = await userService.listDoctors(c.env.DB);
  return c.json({ doctors });
});

// ---------------------------------------------------------------------------
// Public appointment requests
// ---------------------------------------------------------------------------

app.get('/public/doctors', async (c) => {
  return c.json({ doctors: await userService.listPublicDoctors(c.env.DB) });
});

app.post('/public/appointment-requests', async (c) => {
  const parsed = await parseJsonBody(c, createAppointmentRequestSchema);
  if (parsed instanceof Response) return parsed;

  if (parsed.preferred_date < new Date().toISOString().slice(0, 10)) {
    return c.json({ error: 'Preferred date cannot be in the past' }, 400);
  }
  if (parsed.doctor_id) {
    const doctor = await userService.findUserById(c.env.DB, parsed.doctor_id);
    if (!doctor || doctor.role !== 'doctor' || !doctor.is_active) return c.json({ error: 'Invalid doctor' }, 400);
  }
  try {
    const request = await appointmentRequestService.createAppointmentRequest(c.env.DB, parsed);
    await logAudit(c.env.DB, { userId: null, action: 'appointment_request.created', entityType: 'appointment_request', entityId: request.id });

    const recipients = await userService.listActiveUsersByRoles(c.env.DB, ['admin', 'staff']);
    await createNotificationsSafely(
      c.env.DB,
      recipients.map((recipient) => ({
        userId: recipient.id,
        type: 'appointment_request_created',
        entityType: 'appointment_request',
        entityId: request.id,
        metadata: {
          preferred_date: request.preferred_date,
          preferred_time: request.preferred_time,
          service_slug: request.service_slug,
        },
        dedupeKey: `appointment_request_created:${request.id}`,
      })),
    );

    return c.json({ request: { id: request.id, status: request.status, created_at: request.created_at } }, 201);
  } catch (err) {
    if (err instanceof Error && err.message === 'DUPLICATE_REQUEST') return c.json({ error: 'A similar request was recently received' }, 429);
    throw err;
  }
});

app.get('/appointment-requests', requireAuth, requireRole('admin', 'staff'), async (c) => {
  const status = c.req.query('status') as AppointmentRequestStatus | undefined;
  const requests = await appointmentRequestService.listAppointmentRequests(c.env.DB, {
    status: ['pending', 'approved', 'rejected', 'converted'].includes(status ?? '') ? status : undefined,
    date: c.req.query('date') || undefined,
    query: c.req.query('query') || undefined,
  });
  return c.json({ requests });
});

app.get('/appointment-requests/:id', requireAuth, requireRole('admin', 'staff'), async (c) => {
  const request = await appointmentRequestService.getAppointmentRequestById(c.env.DB, c.req.param('id'));
  if (!request) return c.json({ error: 'Appointment request not found' }, 404);
  return c.json({ request });
});

app.patch('/appointment-requests/:id', requireAuth, requireRole('admin', 'staff'), async (c) => {
  const parsed = await parseJsonBody(c, reviewAppointmentRequestSchema);
  if (parsed instanceof Response) return parsed;
  const user = c.get('user');
  const request = await appointmentRequestService.reviewAppointmentRequest(c.env.DB, c.req.param('id'), parsed.status, user.id, parsed.rejection_reason);
  if (!request) return c.json({ error: 'Appointment request cannot be reviewed' }, 409);
  await logAudit(c.env.DB, { userId: user.id, action: `appointment_request.${parsed.status}`, entityType: 'appointment_request', entityId: request.id });
  return c.json({ request });
});

app.post('/appointment-requests/:id/convert', requireAuth, requireRole('admin', 'staff'), async (c) => {
  const parsed = await parseJsonBody(c, convertAppointmentRequestSchema);
  if (parsed instanceof Response) return parsed;
  const user = c.get('user');
  const request = await appointmentRequestService.getAppointmentRequestById(c.env.DB, c.req.param('id'));
  if (!request || request.status !== 'approved') return c.json({ error: 'Only approved requests can be converted' }, 409);
  const doctorId = parsed.doctor_id ?? request.doctor_id;
  if (!doctorId) return c.json({ error: 'A doctor is required before conversion' }, 400);
  const doctor = await userService.findUserById(c.env.DB, doctorId);
  if (!doctor || doctor.role !== 'doctor' || !doctor.is_active) return c.json({ error: 'Invalid doctor' }, 400);

  let patient = parsed.patient_id ? await patientService.getPatientById(c.env.DB, parsed.patient_id) : await patientService.findPatientByPhone(c.env.DB, request.phone);
  if (parsed.patient_id && !patient) return c.json({ error: 'Patient not found' }, 404);
  if (!patient) patient = await patientService.createPatient(c.env.DB, { full_name: request.full_name, phone: request.phone, email: request.email });
  const startAt = `${request.preferred_date}T${request.preferred_time}:00.000Z`;
  const endAt = new Date(Date.parse(startAt) + 30 * 60 * 1000).toISOString();
  try {
    const appointment = await appointmentService.createAppointment(c.env.DB, { patientId: patient.id, doctorId, startTime: startAt, endTime: endAt, reason: request.service_slug ?? request.message, createdBy: user.id });
    const converted = await appointmentRequestService.markAppointmentRequestConverted(c.env.DB, request.id, appointment.id, user.id);
    await logAudit(c.env.DB, { userId: user.id, action: 'appointment_request.converted', entityType: 'appointment_request', entityId: request.id, details: { appointmentId: appointment.id } });
    await logAudit(c.env.DB, { userId: user.id, action: 'appointment.created_from_request', entityType: 'appointment', entityId: appointment.id });
    return c.json({ request: converted, appointment }, 201);
  } catch (err) {
    if (err instanceof appointmentService.AppointmentConflictError) return c.json({ error: 'Doctor already has an appointment in this time range' }, 409);
    throw err;
  }
});

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

app.get('/patients', requireAuth, requireRole('admin', 'staff'), async (c) => {
  const user = c.get('user');
  const page = Math.max(1, Number.parseInt(c.req.query('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(c.req.query('pageSize') ?? '20', 10) || 20));
  const query = c.req.query('query') ?? undefined;
  const result = await patientService.listPatients(c.env.DB, { page, pageSize, query });
  await logAudit(c.env.DB, { userId: user.id, action: 'patient.viewed', entityType: 'patient' });
  return c.json(result);
});

app.post('/patients', requireAuth, requireRole('admin', 'staff'), async (c) => {
  const parsed = await parseJsonBody(c, createPatientSchema);
  if (parsed instanceof Response) return parsed;

  const user = c.get('user');
  const patient = await patientService.createPatient(c.env.DB, parsed);
  await logAudit(c.env.DB, { userId: user.id, action: 'patient.created', entityType: 'patient', entityId: patient.id });
  return c.json({ patient }, 201);
});

app.get('/patients/:id', requireAuth, requireRole('admin', 'staff'), async (c) => {
  const patient = await patientService.getPatientById(c.env.DB, c.req.param('id'));
  if (!patient) return c.json({ error: 'Patient not found' }, 404);
  const notes = await patientService.listPatientNotes(c.env.DB, patient.id);
  const appointments = await appointmentService.listAppointments(c.env.DB, { });
  const history = appointments.filter((appointment) => appointment.patient_id === patient.id);
  await logAudit(c.env.DB, { userId: c.get('user').id, action: 'patient.viewed', entityType: 'patient', entityId: patient.id });
  return c.json({ patient, notes, appointments: history });
});

app.patch('/patients/:id', requireAuth, requireRole('admin', 'staff'), async (c) => {
  const parsed = await parseJsonBody(c, updatePatientSchema);
  if (parsed instanceof Response) return parsed;

  const patient = await patientService.updatePatient(c.env.DB, c.req.param('id'), parsed as patientService.UpdatePatientInput);
  if (!patient) return c.json({ error: 'Patient not found' }, 404);
  await logAudit(c.env.DB, {
    userId: c.get('user').id,
    action: 'patient.updated',
    entityType: 'patient',
    entityId: patient.id,
  });
  return c.json({ patient });
});

app.post('/patients/:id/notes', requireAuth, requireRole('admin', 'staff', 'doctor'), async (c) => {
  const parsed = await parseJsonBody(c, createNoteSchema);
  if (parsed instanceof Response) return parsed;

  const patientId = c.req.param('id');
  const patient = await patientService.getPatientById(c.env.DB, patientId);
  if (!patient) return c.json({ error: 'Patient not found' }, 404);

  const user = c.get('user');
  const note = await patientService.addPatientNote(c.env.DB, { patientId, authorId: user.id, note: parsed.note });
  await logAudit(c.env.DB, {
    userId: user.id,
    action: 'patient_note.created',
    entityType: 'patient_note',
    entityId: note.id,
  });
  return c.json({ note }, 201);
});

// ---------------------------------------------------------------------------
// Medical records
// ---------------------------------------------------------------------------

const clinicalRoles = requireRole('admin', 'staff', 'doctor');
const uuidSchema = z.string().uuid();

app.get('/patients/:patientId/medical-records', requireAuth, clinicalRoles, async (c) => {
  const patientId = c.req.param('patientId');
  if (!uuidSchema.safeParse(patientId).success) return c.json({ error: 'Invalid patient id' }, 400);
  const patient = await patientService.getPatientById(c.env.DB, patientId);
  if (!patient) return c.json({ error: 'Patient not found' }, 404);
  const page = Math.max(1, Number.parseInt(c.req.query('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(c.req.query('pageSize') ?? '20', 10) || 20));
  const user = c.get('user');
  const result = await medicalRecordService.listMedicalRecords(c.env.DB, patientId, { userId: user.id, isDoctor: user.role === 'doctor' }, page, pageSize);
  await logAudit(c.env.DB, { userId: user.id, action: 'medical_record.listed', entityType: 'patient', entityId: patientId });
  return c.json(result);
});

app.post('/patients/:patientId/medical-records', requireAuth, clinicalRoles, async (c) => {
  const parsed = await parseJsonBody(c, createMedicalRecordSchema);
  if (parsed instanceof Response) return parsed;
  const patientId = c.req.param('patientId');
  if (!uuidSchema.safeParse(patientId).success) return c.json({ error: 'Invalid patient id' }, 400);
  const patient = await patientService.getPatientById(c.env.DB, patientId);
  if (!patient) return c.json({ error: 'Patient not found' }, 404);
  const user = c.get('user');
  if (parsed.appointment_id) {
    const appointment = await appointmentService.getAppointmentById(c.env.DB, parsed.appointment_id);
    if (!appointment || appointment.patient_id !== patientId) return c.json({ error: 'Appointment not found' }, 404);
    if (user.role === 'doctor' && appointment.doctor_id !== user.id) return c.json({ error: 'Appointment not found' }, 404);
  }
  const record = await medicalRecordService.createMedicalRecord(c.env.DB, patientId, user.id, {
    record_date: parsed.record_date,
    reason: parsed.reason,
    appointment_id: parsed.appointment_id ?? null,
    examination: parsed.examination ?? null,
    diagnosis: parsed.diagnosis ?? null,
    treatment: parsed.treatment ?? null,
    clinical_notes: parsed.clinical_notes ?? null,
    follow_up: parsed.follow_up ?? null,
    follow_up_date: parsed.follow_up_date ?? null,
  });
  await logAudit(c.env.DB, { userId: user.id, action: 'medical_record.created', entityType: 'medical_record', entityId: record.id });
  return c.json({ record }, 201);
});

app.get('/medical-records/:id', requireAuth, clinicalRoles, async (c) => {
  if (!uuidSchema.safeParse(c.req.param('id')).success) return c.json({ error: 'Invalid medical record id' }, 400);
  const user = c.get('user');
  const record = await medicalRecordService.getMedicalRecordById(c.env.DB, c.req.param('id'), { userId: user.id, isDoctor: user.role === 'doctor' });
  if (!record) return c.json({ error: 'Medical record not found' }, 404);
  await logAudit(c.env.DB, { userId: user.id, action: 'medical_record.viewed', entityType: 'medical_record', entityId: record.id });
  return c.json({ record });
});

app.patch('/medical-records/:id', requireAuth, clinicalRoles, async (c) => {
  if (!uuidSchema.safeParse(c.req.param('id')).success) return c.json({ error: 'Invalid medical record id' }, 400);
  const parsed = await parseJsonBody(c, updateMedicalRecordSchema);
  if (parsed instanceof Response) return parsed;
  const user = c.get('user');
  const existing = await medicalRecordService.getMedicalRecordById(c.env.DB, c.req.param('id'), { userId: user.id, isDoctor: user.role === 'doctor' });
  if (!existing) return c.json({ error: 'Medical record not found' }, 404);
  if (parsed.appointment_id) {
    const appointment = await appointmentService.getAppointmentById(c.env.DB, parsed.appointment_id);
    if (!appointment || appointment.patient_id !== existing.patient_id) return c.json({ error: 'Appointment not found' }, 404);
    if (user.role === 'doctor' && appointment.doctor_id !== user.id) return c.json({ error: 'Appointment not found' }, 404);
  }
  const record = await medicalRecordService.updateMedicalRecord(c.env.DB, existing.id, parsed);
  await logAudit(c.env.DB, { userId: user.id, action: 'medical_record.updated', entityType: 'medical_record', entityId: existing.id });
  return c.json({ record });
});

// ---------------------------------------------------------------------------
// Dental Chart
// ---------------------------------------------------------------------------

app.get('/patients/:patientId/dental-chart', requireAuth, clinicalRoles, async (c) => {
  const patientId = c.req.param('patientId');
  if (!uuidSchema.safeParse(patientId).success) return c.json({ error: 'Invalid patient id' }, 400);
  const patient = await patientService.getPatientById(c.env.DB, patientId);
  if (!patient) return c.json({ error: 'Patient not found' }, 404);
  const user = c.get('user');
  const teeth = await dentalChartService.getDentalChart(c.env.DB, patientId);
  await logAudit(c.env.DB, { userId: user.id, action: 'dental_chart.viewed', entityType: 'dental_chart', entityId: patientId });
  return c.json({ teeth });
});

app.patch('/patients/:patientId/dental-chart/:toothNumber', requireAuth, clinicalRoles, async (c) => {
  const patientId = c.req.param('patientId');
  const toothNumber = Number.parseInt(c.req.param('toothNumber'), 10);
  
  if (!uuidSchema.safeParse(patientId).success) return c.json({ error: 'Invalid patient id' }, 400);
  if (Number.isNaN(toothNumber) || ![11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32, 33, 34, 35, 36, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48].includes(toothNumber)) {
    return c.json({ error: 'Invalid tooth number' }, 400);
  }
  
  const patient = await patientService.getPatientById(c.env.DB, patientId);
  if (!patient) return c.json({ error: 'Patient not found' }, 404);
  
  const parsed = await parseJsonBody(c, updateDentalChartSchema);
  if (parsed instanceof Response) return parsed;
  
  // Validate tooth number matches
  if (parsed.tooth_number !== toothNumber) return c.json({ error: 'Tooth number mismatch' }, 400);
  
  const user = c.get('user');
  const entry = await dentalChartService.updateDentalChartEntry(c.env.DB, patientId, toothNumber, parsed, user.id);
  await logAudit(c.env.DB, { userId: user.id, action: 'dental_chart.updated', entityType: 'dental_chart', entityId: patientId, details: { tooth: toothNumber, status: parsed.status } });
  return c.json({ entry });
});

// ---------------------------------------------------------------------------
// Patient Documents / X-rays
// ---------------------------------------------------------------------------

app.get('/patients/:patientId/documents', requireAuth, clinicalRoles, async (c) => {
  const patientId = c.req.param('patientId');
  if (!uuidSchema.safeParse(patientId).success) return c.json({ error: 'Invalid patient id' }, 400);
  
  const patient = await patientService.getPatientById(c.env.DB, patientId);
  if (!patient) return c.json({ error: 'Patient not found' }, 404);
  
  const user = c.get('user');
  const documents = await documentService.listDocuments(c.env, { patientId });
  await logAudit(c.env.DB, { userId: user.id, action: 'patient_documents.viewed', entityType: 'patient_documents', entityId: patientId });
  return c.json({ documents });
});

app.post('/patients/:patientId/documents', requireAuth, clinicalRoles, async (c) => {
  const patientId = c.req.param('patientId');
  if (!uuidSchema.safeParse(patientId).success) return c.json({ error: 'Invalid patient id' }, 400);
  
  const patient = await patientService.getPatientById(c.env.DB, patientId);
  if (!patient) return c.json({ error: 'Patient not found' }, 404);

  const user = c.get('user');

  // Parse form data
  const formData = await c.req.formData();
  const file = formData.get('file') as File;
  const documentType = formData.get('document_type') as string;
  const description = formData.get('description') as string | null;

  if (!file) return c.json({ error: 'File is required' }, 400);

  // Validate document type
  if (!['xray', 'dental_image', 'clinical_document', 'other'].includes(documentType)) {
    return c.json({ error: 'Invalid document type' }, 400);
  }

  // Validate file
  const fileValidation = validateDocumentFile({
    name: file.name,
    type: file.type,
    size: file.size,
  });

  if (!fileValidation.valid) {
    return c.json({ error: fileValidation.error }, 400);
  }

  try {
    const fileBuffer = await file.arrayBuffer();
    const document = await documentService.uploadDocument(c.env, {
      patientId,
      uploadedBy: user.id,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      documentType: documentType as 'xray' | 'dental_image' | 'clinical_document' | 'other',
      description: description || null,
      fileBuffer,
    });

    await logAudit(c.env.DB, {
      userId: user.id,
      action: 'patient_document.uploaded',
      entityType: 'patient_document',
      entityId: document.id,
      details: { patientId, fileName: file.name, documentType },
    });

    return c.json({ document }, 201);
  } catch (err) {
    console.error('Document upload error:', err);
    return c.json({ error: 'Failed to upload document' }, 500);
  }
});

app.get('/documents/:id', requireAuth, clinicalRoles, async (c) => {
  const documentId = c.req.param('id');
  if (!uuidSchema.safeParse(documentId).success) return c.json({ error: 'Invalid document id' }, 400);

  const user = c.get('user');
  const document = await documentService.getDocumentById(c.env, documentId);
  if (!document) return c.json({ error: 'Document not found' }, 404);

  // Verify user has access to the patient
  const patient = await patientService.getPatientById(c.env.DB, document.patient_id);
  if (!patient) return c.json({ error: 'Patient not found' }, 404);

  // Retrieve and stream the file
  try {
    const fileData = await documentService.getDocumentFile(c.env, document.object_key);
    if (!fileData) return c.json({ error: 'Document file not found' }, 404);

    await logAudit(c.env.DB, {
      userId: user.id,
      action: 'patient_document.accessed',
      entityType: 'patient_document',
      entityId: document.id,
    });

    const buffer = await fileData.object.arrayBuffer();
    return new Response(buffer, {
      headers: {
        'Content-Type': document.mime_type,
        'Content-Disposition': `attachment; filename="${document.file_name}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err) {
    console.error('Document retrieval error:', err);
    return c.json({ error: 'Failed to retrieve document' }, 500);
  }
});

app.delete('/documents/:id', requireAuth, clinicalRoles, async (c) => {
  const documentId = c.req.param('id');
  if (!uuidSchema.safeParse(documentId).success) return c.json({ error: 'Invalid document id' }, 400);

  const user = c.get('user');
  const document = await documentService.getDocumentById(c.env, documentId);
  if (!document) return c.json({ error: 'Document not found' }, 404);

  // Verify user has access to the patient
  const patient = await patientService.getPatientById(c.env.DB, document.patient_id);
  if (!patient) return c.json({ error: 'Patient not found' }, 404);

  try {
    await documentService.deleteDocument(c.env, documentId);
    await logAudit(c.env.DB, {
      userId: user.id,
      action: 'patient_document.deleted',
      entityType: 'patient_document',
      entityId: documentId,
      details: { fileName: document.file_name },
    });

    return c.json({ ok: true });
  } catch (err) {
    console.error('Document deletion error:', err);
    return c.json({ error: 'Failed to delete document' }, 500);
  }
});

app.get('/appointments/:id', requireAuth, async (c) => {
  const appointment = await appointmentService.getAppointmentById(c.env.DB, c.req.param('id'));
  if (!appointment) return c.json({ error: 'Appointment not found' }, 404);
  const user = c.get('user');
  // Only admin/staff can view any appointment; doctors can only view their own
  if (user.role === 'doctor' && appointment.doctor_id !== user.id) return c.json({ error: 'Appointment not found' }, 404);
  if (user.role !== 'admin' && user.role !== 'staff' && user.role !== 'doctor') return c.json({ error: 'Appointment not found' }, 404);
  const record = await medicalRecordService.getMedicalRecordForAppointment(c.env.DB, appointment.id, { userId: user.id, isDoctor: user.role === 'doctor' });
  return c.json({ appointment, medical_record: record });
});

app.get('/calendar', requireAuth, async (c) => {
  const from = c.req.query('from');
  const to = c.req.query('to');
  if (!from || !to || Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) return c.json({ error: 'Valid from and to dates are required' }, 400);
  const user = c.get('user');
  const appointments = await appointmentService.listAppointments(c.env.DB, { from, to, doctorId: user.role === 'doctor' ? user.id : undefined });
  return c.json({ appointments });
});

app.get('/dashboard', requireAuth, async (c) => {
  try {
    const now = new Date();
    const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const user = c.get('user');
    const doctorId = user.role === 'doctor' ? user.id : undefined;
    
    let appointments: any[] = [];
    let upcoming: any[] = [];
    
    try {
      appointments = await appointmentService.listAppointments(c.env.DB, { from: dayStart.toISOString(), to: dayEnd.toISOString(), doctorId });
    } catch (err) {
      console.error('Failed to load today appointments:', err);
      appointments = [];
    }
    
    try {
      upcoming = await appointmentService.listAppointments(c.env.DB, { from: now.toISOString(), doctorId });
    } catch (err) {
      console.error('Failed to load upcoming appointments:', err);
      upcoming = [];
    }

    const upcomingWindowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const upcomingForNotifications = upcoming
      .filter((item) => item.status === 'scheduled' || item.status === 'confirmed')
      .filter((item) => item.start_at > now.toISOString() && item.start_at <= upcomingWindowEnd)
      .slice(0, 20);

    await createNotificationsSafely(
      c.env.DB,
      upcomingForNotifications.map((item) => ({
        userId: user.id,
        type: 'upcoming_appointment',
        entityType: 'appointment',
        entityId: item.id,
        metadata: {
          patient_id: item.patient_id,
          doctor_id: item.doctor_id,
          start_at: item.start_at,
          status: item.status,
        },
        dedupeKey: `upcoming_appointment:${item.id}`,
      })),
    );
    
    let pendingRequests = 0;
    if (user.role !== 'doctor') {
      try {
        const { results } = await c.env.DB.prepare("SELECT COUNT(*) as count FROM appointment_requests WHERE status = 'pending'").all<{ count: number }>();
        if (results && results.length > 0) {
          pendingRequests = results[0].count || 0;
        }
      } catch (err) {
        console.error('Failed to load pending requests:', err);
        pendingRequests = 0;
      }
    }
    
    return c.json({ 
      summary: { 
        today: appointments.length, 
        confirmed: appointments.filter((item) => item.status === 'confirmed').length, 
        completed: appointments.filter((item) => item.status === 'completed').length, 
        cancelled: appointments.filter((item) => item.status === 'cancelled').length, 
        no_show: appointments.filter((item) => item.status === 'no_show').length, 
        pending_requests: pendingRequests 
      }, 
      today: appointments, 
      upcoming: upcoming.filter((item) => item.status !== 'cancelled').slice(0, 8) 
    });
  } catch (err) {
    console.error('Dashboard endpoint error:', err);
    throw err;
  }
});
// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

app.get('/appointments', requireAuth, async (c) => {
  const from = c.req.query('from') ?? undefined;
  const to = c.req.query('to') ?? undefined;
  const user = c.get('user');
  const doctorId = user.role === 'doctor' ? user.id : (c.req.query('doctorId') ?? undefined);
  const status = (c.req.query('status') as AppointmentStatus | undefined) ?? undefined;
  const appointments = await appointmentService.listAppointments(c.env.DB, { from, to, doctorId, status });
  return c.json({ appointments });
});

app.get('/appointments/today', requireAuth, async (c) => {
  const user = c.get('user');
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();
  const doctorId = user.role === 'doctor' ? user.id : (c.req.query('doctorId') ?? undefined);
  const appointments = await appointmentService.listAppointments(c.env.DB, {
    from: startOfDay,
    to: endOfDay,
    doctorId,
  });
  return c.json({ appointments });
});

app.post('/appointments', requireAuth, requireRole('admin', 'staff'), async (c) => {
  const parsed = await parseJsonBody(c, createAppointmentSchema);
  if (parsed instanceof Response) return parsed;

  if (new Date(parsed.end_at) <= new Date(parsed.start_at)) {
    return c.json({ error: 'end_at must be after start_at' }, 400);
  }

  const user = c.get('user');
  try {
    const appointment = await appointmentService.createAppointment(c.env.DB, {
      patientId: parsed.patient_id,
      doctorId: parsed.doctor_id,
      startTime: parsed.start_at,
      endTime: parsed.end_at,
      reason: parsed.reason,
      createdBy: user.id,
    });
    await logAudit(c.env.DB, {
      userId: user.id,
      action: 'appointment.created',
      entityType: 'appointment',
      entityId: appointment.id,
    });
    return c.json({ appointment }, 201);
  } catch (err) {
    if (err instanceof appointmentService.AppointmentConflictError) {
      return c.json({ error: 'Doctor already has an appointment in this time range' }, 409);
    }
    throw err;
  }
});

app.patch('/appointments/:id', requireAuth, requireRole('admin', 'staff', 'doctor'), async (c) => {
  const parsed = await parseJsonBody(c, updateAppointmentSchema);
  if (parsed instanceof Response) return parsed;

  const user = c.get('user');
  const id = c.req.param('id');
  const existing = await appointmentService.getAppointmentById(c.env.DB, id);
  if (!existing) return c.json({ error: 'Appointment not found' }, 404);
  const nextStart = parsed.start_at ?? existing.start_at;
  const nextEnd = parsed.end_at ?? existing.end_at;
  if (new Date(nextEnd) <= new Date(nextStart)) return c.json({ error: 'end_at must be after start_at' }, 400);

  // Doctors may only update the status of their own appointments (e.g. complete/no-show).
  if (user.role === 'doctor') {
    if (existing.doctor_id !== user.id) {
      return c.json({ error: 'Appointment not found' }, 404);
    }
    if (parsed.doctor_id || parsed.start_at || parsed.end_at) {
      return c.json({ error: 'Doctors may only update appointment status' }, 403);
    }
  }

  try {
    const appointment = await appointmentService.updateAppointment(c.env.DB, id, {
      doctorId: parsed.doctor_id,
      startTime: parsed.start_at,
      endTime: parsed.end_at,
      reason: parsed.reason,
      status: parsed.status,
    });
    if (!appointment) return c.json({ error: 'Appointment not found' }, 404);
    await logAudit(c.env.DB, {
      userId: user.id,
      action: parsed.status === 'cancelled' ? 'appointment.cancelled' : 'appointment.updated',
      entityType: 'appointment',
      entityId: appointment.id,
    });

    const recipientUsers = await userService.listActiveUsersByRoles(c.env.DB, ['admin', 'staff']);
    const recipientIds = new Set<string>(recipientUsers.map((item) => item.id));
    recipientIds.add(appointment.doctor_id);
    recipientIds.delete(user.id);

    const baseMetadata = {
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      start_at: appointment.start_at,
      end_at: appointment.end_at,
      status: appointment.status,
    };

    const notificationsToCreate: Array<{
      userId: string;
      type: NotificationType;
      entityType: 'appointment';
      entityId: string;
      metadata: Record<string, unknown>;
      dedupeKey: string;
    }> = [];

    if (existing.status !== appointment.status) {
      if (appointment.status === 'confirmed') {
        for (const recipientId of recipientIds) {
          notificationsToCreate.push({
            userId: recipientId,
            type: 'appointment_confirmed',
            entityType: 'appointment',
            entityId: appointment.id,
            metadata: baseMetadata,
            dedupeKey: `appointment_confirmed:${appointment.id}:${appointment.updated_at}`,
          });
        }
      }
      if (appointment.status === 'cancelled') {
        for (const recipientId of recipientIds) {
          notificationsToCreate.push({
            userId: recipientId,
            type: 'appointment_cancelled',
            entityType: 'appointment',
            entityId: appointment.id,
            metadata: baseMetadata,
            dedupeKey: `appointment_cancelled:${appointment.id}:${appointment.updated_at}`,
          });
        }
      }
    }

    const wasRescheduled =
      existing.doctor_id !== appointment.doctor_id ||
      existing.start_at !== appointment.start_at ||
      existing.end_at !== appointment.end_at;

    if (wasRescheduled) {
      for (const recipientId of recipientIds) {
        notificationsToCreate.push({
          userId: recipientId,
          type: 'appointment_rescheduled',
          entityType: 'appointment',
          entityId: appointment.id,
          metadata: {
            ...baseMetadata,
            previous_doctor_id: existing.doctor_id,
            previous_start_at: existing.start_at,
            previous_end_at: existing.end_at,
          },
          dedupeKey: `appointment_rescheduled:${appointment.id}:${appointment.updated_at}`,
        });
      }
    }

    await createNotificationsSafely(c.env.DB, notificationsToCreate);

    return c.json({ appointment });
  } catch (err) {
    if (err instanceof appointmentService.AppointmentConflictError) {
      return c.json({ error: 'Doctor already has an appointment in this time range' }, 409);
    }
    throw err;
  }
});

// ---------------------------------------------------------------------------
// Notifications (persistent in-app notifications)
// ---------------------------------------------------------------------------

app.get('/notifications', requireAuth, async (c) => {
  const user = c.get('user');
  const page = Math.max(1, Number.parseInt(c.req.query('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(c.req.query('pageSize') ?? '20', 10) || 20));
  const filter = c.req.query('filter') === 'unread' ? 'unread' : 'all';

  const result = await notificationService.listNotificationsForUser(c.env.DB, user.id, {
    page,
    pageSize,
    unreadOnly: filter === 'unread',
  });
  return c.json(result);
});

app.get('/notifications/unread-count', requireAuth, async (c) => {
  const unread = await notificationService.getUnreadCount(c.env.DB, c.get('user').id);
  return c.json({ unread });
});

app.patch('/notifications/:id/read', requireAuth, async (c) => {
  const id = c.req.param('id');
  if (!uuidSchema.safeParse(id).success) return c.json({ error: 'Invalid notification id' }, 400);

  const user = c.get('user');
  const found = await notificationService.markNotificationAsRead(c.env.DB, user.id, id);
  if (!found) return c.json({ error: 'Notification not found' }, 404);
  return c.json({ ok: true });
});

app.post('/notifications/read-all', requireAuth, async (c) => {
  const user = c.get('user');
  const updated = await notificationService.markAllNotificationsAsRead(c.env.DB, user.id);
  return c.json({ updated });
});

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal server error' }, 500);
});

export const onRequest: PagesFunction<Env> = (context) => app.fetch(context.request, context.env);
