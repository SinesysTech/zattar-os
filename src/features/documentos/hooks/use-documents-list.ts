import { useState, useEffect, useCallback } from 'react';
import { actionListarDocumentos } from '../actions/documentos-actions';
import type { DocumentoComUsuario, ListarDocumentosParams } from '../types';

export function useDocumentsList(initialParams?: ListarDocumentosParams) {
  const [documents, setDocuments] = useState<DocumentoComUsuario[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<ListarDocumentosParams>(initialParams || {});

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await actionListarDocumentos(params);
    if (result.success) {
      setDocuments(result.data || []);
      setTotal(result.total || 0);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [params]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const updateParams = useCallback((newParams: Partial<ListarDocumentosParams>) => {
    setParams((prevParams) => ({ ...prevParams, ...newParams }));
  }, []);

  return {
    documents,
    total,
    loading,
    error,
    params,
    updateParams,
    refetch: fetchDocuments,
  };
}
