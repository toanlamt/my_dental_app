import { Hono } from 'hono';
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
  parseJsonBody,
} from '../lib/validation';
import { toPublicUser, type AppointmentStatus, type AppointmentRequestStatus } from '../lib/types';
import * as userService from '../services/user.service';
import * as patientService from '../services/patient.service';
import * as appointmentService from '../services/appointment.service';
import * as notificationService from '../services/notification.service';
import * as appointmentRequestService from '../services/appointment-request.service';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>().basePath('/api');

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

app.get('/patients', requireAuth, async (c) => {
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

app.get('/patients/:id', requireAuth, async (c) => {
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

app.get('/appointments/:id', requireAuth, async (c) => {
  const appointment = await appointmentService.getAppointmentById(c.env.DB, c.req.param('id'));
  if (!appointment) return c.json({ error: 'Appointment not found' }, 404);
  if (c.get('user').role === 'doctor' && appointment.doctor_id !== c.get('user').id) return c.json({ error: 'Appointment not found' }, 404);
  return c.json({ appointment });
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
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayEnd = new Date(dayStart.getTime() + 86400000);
  const user = c.get('user');
  const doctorId = user.role === 'doctor' ? user.id : undefined;
  const appointments = await appointmentService.listAppointments(c.env.DB, { from: dayStart.toISOString(), to: dayEnd.toISOString(), doctorId });
  const upcoming = await appointmentService.listAppointments(c.env.DB, { from: now.toISOString(), doctorId });
  return c.json({ summary: { today: appointments.length, confirmed: appointments.filter((item) => item.status === 'confirmed').length, completed: appointments.filter((item) => item.status === 'completed').length, cancelled: appointments.filter((item) => item.status === 'cancelled').length }, today: appointments, upcoming: upcoming.filter((item) => item.status !== 'cancelled').slice(0, 8) });
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
    return c.json({ appointment });
  } catch (err) {
    if (err instanceof appointmentService.AppointmentConflictError) {
      return c.json({ error: 'Doctor already has an appointment in this time range' }, 409);
    }
    throw err;
  }
});

// ---------------------------------------------------------------------------
// Notifications (derived from appointments/audit_logs, no dedicated table)
// ---------------------------------------------------------------------------

app.get('/notifications', requireAuth, async (c) => {
  const notifications = await notificationService.getNotificationsForUser(c.env.DB, c.get('user'));
  return c.json({ notifications });
});

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal server error' }, 500);
});

export const onRequest: PagesFunction<Env> = (context) => app.fetch(context.request, context.env);
