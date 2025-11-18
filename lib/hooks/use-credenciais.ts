'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CredencialComAdvogado, ListarCredenciaisParams } from '@/backend/types/credenciais/types';

interface CredenciaisApiResponse {
  success: boolean;
  data: CredencialComAdvogado[];
}

interface UseCredenciaisResult {
  credenciais: CredencialComAdvogado[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar credenciais de um advogado
 */
export const useCredenciais = (
  advogadoId: number | null,
  params: { active?: boolean } = {}
): UseCredenciaisResult => {
  const [credenciais, setCredenciais] = useState<CredencialComAdvogado[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarCredenciais = useCallback(async () => {
    if (!advogadoId) {
      setCredenciais([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Construir query string
      const searchParams = new URLSearchParams();

      if (params.active !== undefined) {
        searchParams.set('active', params.active.toString());
      }

      const response = await fetch(
        `/api/advogados/${advogadoId}/credenciais?${searchParams.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: CredenciaisApiResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setCredenciais(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar credenciais';
      setError(errorMessage);
      setCredenciais([]);
    } finally {
      setIsLoading(false);
    }
  }, [advogadoId, params.active]);

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

