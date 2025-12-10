import { useState, useEffect, useCallback } from 'react';
import { actionListarCompartilhamentos, actionCompartilharDocumento, actionAtualizarPermissao, actionRemoverCompartilhamento } from '../actions/compartilhamento-actions';
import type { DocumentoCompartilhadoComUsuario, CompartilharDocumentoParams } from '../types';

export function useDocumentSharing(documentoId: number) {
  const [shares, setShares] = useState<DocumentoCompartilhadoComUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShares = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await actionListarCompartilhamentos(documentoId);
    if (result.success) {
      setShares(result.data || []);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [documentoId]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const shareDocument = useCallback(async (params: CompartilharDocumentoParams) => {
    setError(null);
    const formData = new FormData();
    formData.append('documento_id', String(params.documento_id));
    formData.append('usuario_id', String(params.usuario_id));
    formData.append('permissao', params.permissao);
    formData.append('pode_deletar', String(params.pode_deletar));

    const result = await actionCompartilharDocumento(formData);
    if (result.success) {
      fetchShares();
      return result.data;
    } else {
      setError(result.error);
      throw new Error(result.error);
    }
  }, [fetchShares]);

  const updatePermission = useCallback(async (compartilhamentoId: number, permissao: 'visualizar' | 'editar') => {
    setError(null);
    const result = await actionAtualizarPermissao(compartilhamentoId, permissao);
    if (result.success) {
      fetchShares();
      return result.data;
    } else {
      setError(result.error);
      throw new Error(result.error);
    }
  }, [fetchShares]);

  const removeShare = useCallback(async (compartilhamentoId: number) => {
    setError(null);
    const result = await actionRemoverCompartilhamento(compartilhamentoId);
    if (result.success) {
      fetchShares();
    } else {
      setError(result.error);
      throw new Error(result.error);
    }
  }, [fetchShares]);

  return {
    shares,
    loading,
    error,
    fetchShares,
    shareDocument,
    updatePermission,
    removeShare,
  };
}
