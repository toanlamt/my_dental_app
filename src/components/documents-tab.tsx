import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Card } from './ui/primitives';

interface PatientDocument {
  id: string;
  patient_id: string;
  uploaded_by: string;
  file_name: string;
  object_key: string;
  mime_type: string;
  file_size: number;
  document_type: 'xray' | 'dental_image' | 'clinical_document' | 'other';
  description: string | null;
  created_at: string;
  updated_at: string;
  uploaded_by_name?: string;
}

interface DocumentsTabProps {
  patientId: string;
  documents: PatientDocument[];
  isLoading: boolean;
  canEdit: boolean;
  onDocumentsChange: () => void;
}

export function DocumentsTab({ patientId, documents, isLoading, canEdit, onDocumentsChange }: DocumentsTabProps) {
  const { t } = useTranslation();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<'xray' | 'dental_image' | 'clinical_document' | 'other'>('xray');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError(t('documents.selectFile'));
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('document_type', selectedType);
      if (description) formData.append('description', description);

      const response = await fetch(`/api/patients/${patientId}/documents`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        setUploadError(errorData.error || t('documents.unableToUpload'));
        return;
      }

      // Reset form
      setSelectedFile(null);
      setSelectedType('xray');
      setDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh documents
      onDocumentsChange();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(t('documents.unableToUpload'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Download failed:', response.statusText);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm(t('documents.deleteConfirm'))) return;

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Delete failed:', response.statusText);
        return;
      }

      onDocumentsChange();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getDocumentTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      xray: t('documents.xray'),
      dental_image: t('documents.dentalImage'),
      clinical_document: t('documents.clinicalDocument'),
      other: t('documents.other'),
    };
    return typeMap[type] || type;
  };

  const getPreviewUrl = (mimeType: string): boolean => {
    return ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(mimeType);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500">{t('documents.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {canEdit && (
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('documents.uploadDocument')}</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('documents.documentType')} *
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="xray">{t('documents.xray')}</option>
                  <option value="dental_image">{t('documents.dentalImage')}</option>
                  <option value="clinical_document">{t('documents.clinicalDocument')}</option>
                  <option value="other">{t('documents.other')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('documents.description')} ({t('documents.optional')})
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('documents.descriptionPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('documents.selectFile')} *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              {uploadError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {uploadError}
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="w-full"
              >
                {isUploading ? t('common.saving') : t('documents.upload')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">{t('documents.title')}</h3>

        {documents.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-600">{t('documents.noDocuments')}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{doc.file_name}</p>
                        <div className="mt-1 space-y-1 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">{t('documents.documentType')}:</span> {getDocumentTypeLabel(doc.document_type)}
                          </p>
                          <p>
                            <span className="font-medium">{t('documents.fileSize')}:</span> {formatFileSize(doc.file_size)}
                          </p>
                          {doc.uploaded_by_name && (
                            <p>
                              <span className="font-medium">{t('documents.uploadedBy')}:</span> {doc.uploaded_by_name}
                            </p>
                          )}
                          <p>
                            <span className="font-medium">{t('documents.uploadedAt')}:</span>{' '}
                            {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                          {doc.description && (
                            <p className="mt-2">
                              <span className="font-medium">{t('documents.description')}:</span> {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {getPreviewUrl(doc.mime_type) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc.id, doc.file_name)}
                      >
                        {doc.mime_type === 'application/pdf' ? t('documents.download') : t('documents.preview')}
                      </Button>
                    )}
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {t('documents.delete')}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
