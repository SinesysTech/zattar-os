/**
 * React Hooks for Credenciais
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CredencialComAdvogado, ListarCredenciaisParams } from '../domain';
import { actionListarCredenciais } from '../actions/credenciais-actions';

interface UseCredenciaisResult {
  credenciais: CredencialComAdvogado[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCredenciais = (params: ListarCredenciaisParams = {}): UseCredenciaisResult => {
  const [credenciais, setCredenciais] = useState<CredencialComAdvogado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarCredenciais = useCallback(async () => {
    // Sentinel: alguns formulários passam `advogado_id: 0` antes da seleção.
    // Nesse caso, não buscamos nada e evitamos erro/requests desnecessários.
    if (params.advogado_id === 0) {
      setCredenciais([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarCredenciais(params);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao buscar credenciais');
      }

      setCredenciais(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar credenciais';
      setError(errorMessage);
      setCredenciais([]);
    } finally {
      setIsLoading(false);
    }
  }, [params.advogado_id, params.active]);

  useEffect(() => {
    buscarCredenciais();
  }, [buscarCredenciais]);

  return {
    credenciais,
    isLoading,
    error,
    refetch: buscarCredenciais,
  };
};
