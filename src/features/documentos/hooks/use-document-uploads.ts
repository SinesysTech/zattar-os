import { useState, useEffect, useCallback } from 'react';
import { actionListarUploads, actionUploadArquivo, actionGerarPresignedUrl } from '../actions/uploads-actions';
import type { DocumentoUploadComInfo } from '../types';

export function useDocumentUploads(documentoId: number) {
  const [uploads, setUploads] = useState<DocumentoUploadComInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0); // New state for tracking progress

  const fetchUploads = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await actionListarUploads(documentoId);
    if (result.success) {
      setUploads(result.data || []);
      setTotal(result.total || 0);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [documentoId]);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  const uploadFile = useCallback(async (file: File) => {
    setError(null);
    setUploadProgress(0); // Reset progress

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documento_id', String(documentoId));

    // Simulate progress for now, actual implementation would require a custom fetcher
    // This is a simplified example, real progress tracking with Server Actions is complex
    // and might require a different approach (e.g., direct API routes, or a separate upload service)
    const simulateProgress = (currentProgress: number) => {
      if (currentProgress < 100) {
        setUploadProgress(currentProgress + 10);
        setTimeout(() => simulateProgress(currentProgress + 10), 100);
      }
    };
    simulateProgress(0);

    const result = await actionUploadArquivo(formData);
    if (result.success) {
      setUploadProgress(100); // Set to 100 on success
      fetchUploads();
      return result.data;
    } else {
      setError(result.error);
      setUploadProgress(0); // Reset on error
      throw new Error(result.error);
    }
  }, [documentoId, fetchUploads]);

  const generatePresignedUpload = useCallback(async (filename: string, contentType: string) => {
    setError(null);
    const result = await actionGerarPresignedUrl(filename, contentType);
    if (result.success) {
      return result.data;
    } else {
      setError(result.error);
      throw new Error(result.error);
    }
  }, []);

  return {
    uploads,
    total,
    loading,
    error,
    uploadProgress,
    fetchUploads,
    uploadFile,
    generatePresignedUpload,
  };
}
