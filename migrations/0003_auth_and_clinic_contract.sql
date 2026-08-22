-- Normalize the original MVP schema to the public API contract.
ALTER TABLE users RENAME COLUMN email TO username;
ALTER TABLE users RENAME COLUMN name TO full_name;
ALTER TABLE users ADD COLUMN updated_at TEXT;
UPDATE users SET updated_at = created_at WHERE updated_at IS NULL;

ALTER TABLE patients RENAME COLUMN dob TO date_of_birth;
ALTER TABLE patients DROP COLUMN created_by;
ALTER TABLE patients ADD COLUMN medical_notes TEXT;

ALTER TABLE patient_notes ADD COLUMN updated_at TEXT;
UPDATE patient_notes SET updated_at = created_at WHERE updated_at IS NULL;

PRAGMA foreign_keys = OFF;
CREATE TABLE appointments_v2 (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  doctor_id TEXT NOT NULL REFERENCES users(id),
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  reason TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO appointments_v2 (id, patient_id, doctor_id, start_at, end_at, status, reason, created_at, updated_at)
SELECT id, patient_id, doctor_id, start_time, end_time, status, reason, created_at, updated_at
FROM appointments;
DROP TABLE appointments;
ALTER TABLE appointments_v2 RENAME TO appointments;
PRAGMA foreign_keys = ON;

CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_start_at ON appointments(start_at);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
