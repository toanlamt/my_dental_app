export type Role = 'admin' | 'doctor' | 'staff';

export type User = {
  id: string;
  username: string;
  password_hash: string;
  full_name: string;
  role: Role;
  is_active: number;
  created_at: string;
  updated_at: string;
  email?: string;
  name?: string;
};

export type PublicUser = Omit<User, 'password_hash'>;

export type Gender = 'male' | 'female' | 'other';

export type Patient = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  gender: Gender | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  medical_notes: string | null;
  created_at: string;
  updated_at: string;
  dob?: string | null;
};

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export type AppointmentRequestStatus = 'pending' | 'approved' | 'rejected' | 'converted';

export type AppointmentRequest = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  service_slug: string | null;
  doctor_id: string | null;
  doctor_name?: string | null;
  preferred_date: string;
  preferred_time: string;
  message: string | null;
  status: AppointmentRequestStatus;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  converted_appointment_id: string | null;
};

export type Appointment = {
  id: string;
  patient_id: string;
  doctor_id: string;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  start_time?: string;
  end_time?: string;
};

export type PatientNote = {
  id: string;
  patient_id: string;
  author_id: string;
  note: string;
  created_at: string;
  updated_at: string;
};

export type AuditLog = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string | null;
  created_at: string;
};

export function toPublicUser(user: User): PublicUser {
  const { password_hash: _password_hash, ...rest } = user;
  return { ...rest, email: user.username, name: user.full_name };
}
