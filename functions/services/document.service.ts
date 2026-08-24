import type { Env } from '../lib/db';
import type { PatientDocument } from '../lib/types';

/**
 * Generate a UUID v4
 */
function randomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export type UploadDocumentParams = {
  patientId: string;
  uploadedBy: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  documentType: 'xray' | 'dental_image' | 'clinical_document' | 'other';
  description: string | null;
  fileBuffer: ArrayBuffer;
};

export type ListDocumentsParams = {
  patientId: string;
};

/**
 * Generate a safe object key for R2 storage.
 * Format: patients/{patientId}/documents/{uuid}
 */
export function generateObjectKey(patientId: string): string {
  const uuid = randomUUID();
  return `patients/${patientId}/documents/${uuid}`;
}

/**
 * Upload a document file to R2 and save metadata to D1.
 * Handles failure consistency: if metadata insert fails, the R2 object is deleted.
 */
export async function uploadDocument(env: Env, params: UploadDocumentParams): Promise<PatientDocument> {
  const documentId = randomUUID();
  const objectKey = generateObjectKey(params.patientId);

  // Upload to R2
  const uploadedObject = await env.DOCUMENTS.put(objectKey, params.fileBuffer, {
    httpMetadata: {
      contentType: params.mimeType,
      contentDisposition: `attachment; filename="${params.fileName}"`,
    },
    customMetadata: {
      patientId: params.patientId,
      documentId: documentId,
    },
  });

  if (!uploadedObject) {
    throw new Error('Failed to upload file to R2');
  }

  try {
    // Save metadata to D1
    const result = await env.DB.prepare(
      `INSERT INTO patient_documents
       (id, patient_id, uploaded_by, file_name, object_key, mime_type, file_size, document_type, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        documentId,
        params.patientId,
        params.uploadedBy,
        params.fileName,
        objectKey,
        params.mimeType,
        params.fileSize,
        params.documentType,
        params.description
      )
      .run();

    if (!result.success) {
      // Metadata insert failed, delete the R2 object
      await env.DOCUMENTS.delete(objectKey);
      throw new Error('Failed to save document metadata');
    }

    return {
      id: documentId,
      patient_id: params.patientId,
      uploaded_by: params.uploadedBy,
      file_name: params.fileName,
      object_key: objectKey,
      mime_type: params.mimeType,
      file_size: params.fileSize,
      document_type: params.documentType,
      description: params.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    // Clean up R2 object if D1 operation fails
    await env.DOCUMENTS.delete(objectKey);
    throw error;
  }
}

/**
 * List all documents for a patient.
 */
export async function listDocuments(env: Env, params: ListDocumentsParams): Promise<PatientDocument[]> {
  const rows = await env.DB.prepare(
    `SELECT d.*, u.full_name as uploaded_by_name
     FROM patient_documents d
     LEFT JOIN users u ON d.uploaded_by = u.id
     WHERE d.patient_id = ?
     ORDER BY d.created_at DESC`
  )
    .bind(params.patientId)
    .all<PatientDocument>();

  return rows.results || [];
}

/**
 * Get a single document by ID.
 */
export async function getDocumentById(env: Env, documentId: string): Promise<PatientDocument | null> {
  const row = await env.DB.prepare(
    `SELECT d.*, u.full_name as uploaded_by_name
     FROM patient_documents d
     LEFT JOIN users u ON d.uploaded_by = u.id
     WHERE d.id = ?`
  )
    .bind(documentId)
    .first<PatientDocument>();

  return row || null;
}

/**
 * Retrieve a document file from R2.
 * Returns { object, fileName, mimeType }.
 */
export async function getDocumentFile(
  env: Env,
  objectKey: string
): Promise<{ object: any; fileName: string; mimeType: string } | null> {
  const object = await env.DOCUMENTS.get(objectKey);

  if (!object) {
    return null;
  }

  const fileName = object.httpMetadata?.contentDisposition?.split('filename="')[1]?.split('"')[0] || 'document';
  const mimeType = object.httpMetadata?.contentType || 'application/octet-stream';

  return { object, fileName, mimeType };
}

/**
 * Delete a document from both R2 and D1.
 * Handles consistency: tries to delete both, reports any errors.
 */
export async function deleteDocument(env: Env, documentId: string): Promise<boolean> {
  // Get metadata first
  const document = await getDocumentById(env, documentId);
  if (!document) {
    return false;
  }

  // Delete from R2
  await env.DOCUMENTS.delete(document.object_key);

  // Delete metadata from D1
  const result = await env.DB.prepare('DELETE FROM patient_documents WHERE id = ?').bind(documentId).run();

  return result.success;
}
