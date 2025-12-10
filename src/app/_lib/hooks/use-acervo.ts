'use client';

// Hook para buscar processos do acervo (suporta unificação de multi-instância)

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AcervoApiResponse, BuscarProcessosParams } from '@/app/_lib/types/acervo';
import type { Acervo, ProcessoUnificado } from '@/backend/types/acervo/types';

interface UseAcervoResult {
  processos: (Acervo | ProcessoUnificado)[];
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
  const [processos, setProcessos] = useState<(Acervo | ProcessoUnificado)[]>([]);
  const [paginacao, setPaginacao] = useState<UseAcervoResult['paginacao']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoizar query string para evitar re-renders infinitos
  // Usa propriedades individuais como dependências para evitar recálculos desnecessários
  // quando apenas a referência do objeto params muda
  const queryString = useMemo(() => {
    const searchParams = new URLSearchParams();

    if (params.pagina !== undefined) {
      searchParams.set('pagina', params.pagina.toString());
    }
    if (params.limite !== undefined) {
      searchParams.set('limite', params.limite.toString());
    }
    // unified default é true no backend, mas vamos ser explícitos aqui se fornecido
    if (params.unified !== undefined) {
      searchParams.set('unified', params.unified.toString());
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
        key !== 'unified' &&
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

    return searchParams.toString();
  }, [params]);

  const buscarProcessos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/acervo?${queryString}`);

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
  }, [queryString]);

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

