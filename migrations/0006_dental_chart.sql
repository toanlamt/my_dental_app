CREATE TABLE patient_dental_chart (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  tooth_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'healthy',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT REFERENCES users(id),
  UNIQUE(patient_id, tooth_number)
);

CREATE INDEX idx_dental_chart_patient ON patient_dental_chart(patient_id);
CREATE INDEX idx_dental_chart_tooth ON patient_dental_chart(tooth_number);
