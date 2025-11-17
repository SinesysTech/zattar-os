'use client';

// Hook para buscar processos do acervo

import { useState, useEffect, useCallback } from 'react';
import type { AcervoApiResponse, BuscarProcessosParams } from '@/lib/types/acervo';
import type { Acervo } from '@/backend/types/acervo/types';

interface UseAcervoResult {
  processos: Acervo[];
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

/**
 * Hook para buscar processos do acervo
 */
export const useAcervo = (params: BuscarProcessosParams = {}): UseAcervoResult => {
  const [processos, setProcessos] = useState<Acervo[]>([]);
  const [paginacao, setPaginacao] = useState<UseAcervoResult['paginacao']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarProcessos = useCallback(async () => {
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

      const response = await fetch(`/api/acervo?${searchParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: AcervoApiResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setProcessos(data.data.processos);
      setPaginacao(data.data.paginacao);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar processos';
      setError(errorMessage);
      setProcessos([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    buscarProcessos();
  }, [buscarProcessos]);

  return {
    processos,
    paginacao,
    isLoading,
    error,
    refetch: buscarProcessos,
  };
};

