-- Create patient_documents table for storing document metadata
-- Binary file content is stored in R2; this table only stores metadata
CREATE TABLE patient_documents (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  file_name TEXT NOT NULL,
  object_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('xray', 'dental_image', 'clinical_document', 'other')),
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create indexes for common queries
CREATE INDEX idx_patient_documents_patient ON patient_documents(patient_id);
CREATE INDEX idx_patient_documents_created ON patient_documents(created_at);
CREATE INDEX idx_patient_documents_type ON patient_documents(document_type);
