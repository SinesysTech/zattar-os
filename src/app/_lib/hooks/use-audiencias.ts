'use client';

// Hook para buscar audiências

import { useState, useEffect, useCallback } from 'react';
import type { AudienciasApiResponse, BuscarAudienciasParams } from '@/core/app/_lib/types/audiencias';
import type { Audiencia } from '@/backend/types/audiencias/types';

interface UseAudienciasResult {
  audiencias: Audiencia[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseAudienciasOptions {
  /** Se false, não faz a busca (útil para aguardar inicialização de parâmetros) */
  enabled?: boolean;
}

/**
 * Hook para buscar audiências
 */
export const useAudiencias = (
  params: BuscarAudienciasParams = {},
  options: UseAudienciasOptions = {}
): UseAudienciasResult => {
  const { enabled = true } = options;
  const [audiencias, setAudiencias] = useState<Audiencia[]>([]);
  const [paginacao, setPaginacao] = useState<UseAudienciasResult['paginacao']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarAudiencias = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Construir query string
      const searchParams = new URLSearchParams();
      
      if (params.pagina !== undefined) {
        searchParams.set('pagina', params.pagina.toString());
      }
      if (params.limite !== undefined) {
        searchParams.set('limite', params.limite.toString());
      }
      if (params.busca) {
        searchParams.set('busca', params.busca);
      }
      if (params.ordenar_por) {
        searchParams.set('ordenar_por', params.ordenar_por);
      }
      if (params.ordem) {
        searchParams.set('ordem', params.ordem);
      }
      
      // Adicionar outros filtros
      Object.entries(params).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          key !== 'pagina' &&
          key !== 'limite' &&
          key !== 'busca' &&
          key !== 'ordenar_por' &&
          key !== 'ordem'
        ) {
          if (typeof value === 'boolean') {
            searchParams.set(key, value.toString());
          } else {
            searchParams.set(key, String(value));
          }
        }
      });

      const response = await fetch(`/api/audiencias?${searchParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        const apiMsg =
          errorData && typeof errorData.error === 'object' && errorData.error !== null
            ? errorData.error.message
            : errorData.error;
        throw new Error(apiMsg || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: AudienciasApiResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setAudiencias(data.data.audiencias);
      setPaginacao(data.data.paginacao);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar audiências';
      setError(errorMessage);
      setAudiencias([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [params, enabled]);

  useEffect(() => {
    buscarAudiencias();
  }, [buscarAudiencias]);

  return {
    audiencias,
    paginacao,
    isLoading,
    error,
    refetch: buscarAudiencias,
  };
};

