CREATE TABLE appointment_requests (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  service_slug TEXT,
  doctor_id TEXT REFERENCES users(id),
  preferred_date TEXT NOT NULL,
  preferred_time TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted')),
  rejection_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT,
  reviewed_by TEXT REFERENCES users(id),
  converted_appointment_id TEXT REFERENCES appointments(id)
);

CREATE INDEX idx_appointment_requests_status ON appointment_requests(status);
CREATE INDEX idx_appointment_requests_date ON appointment_requests(preferred_date);
CREATE INDEX idx_appointment_requests_created ON appointment_requests(created_at);
CREATE INDEX idx_appointment_requests_phone ON appointment_requests(phone);