'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Acervo, ProcessoUnificado } from '@/backend/types/acervo/types';

type ProcessoDetail = Acervo | ProcessoUnificado;

interface UseProcessoDetailsResult {
  processo: ProcessoDetail | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useProcessoDetails = (processoId: number | null): UseProcessoDetailsResult => {
  const [processo, setProcesso] = useState<ProcessoDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProcesso = useCallback(async () => {
    if (!processoId) {
      setProcesso(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/acervo/${processoId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Resposta da API indicou falha');
      }

      setProcesso(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar detalhes do processo';
      setError(errorMessage);
      setProcesso(null);
    } finally {
      setIsLoading(false);
    }
  }, [processoId]);

  useEffect(() => {
    fetchProcesso();
  }, [fetchProcesso]);

  return {
    processo,
    isLoading,
    error,
    refetch: fetchProcesso,
  };
};
