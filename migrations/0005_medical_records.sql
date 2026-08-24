CREATE TABLE medical_records (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  appointment_id TEXT REFERENCES appointments(id),
  author_id TEXT NOT NULL REFERENCES users(id),
  record_date TEXT NOT NULL,
  reason TEXT NOT NULL,
  examination TEXT,
  diagnosis TEXT,
  treatment TEXT,
  clinical_notes TEXT,
  follow_up TEXT,
  follow_up_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_medical_records_appointment ON medical_records(appointment_id);
CREATE INDEX idx_medical_records_date ON medical_records(record_date);