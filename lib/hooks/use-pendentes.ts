'use client';

// Hook para buscar expedientes pendentes de manifestação

import { useState, useEffect, useCallback } from 'react';
import type {
  ExpedientesApiResponse,
  BuscarExpedientesParams,
} from '@/lib/types/expedientes';
import type { PendenteManifestacao } from '@/backend/types/pendentes/types';

interface UsePendentesResult {
  expedientes: PendenteManifestacao[];
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
 * Hook para buscar expedientes pendentes de manifestação
 */
export const usePendentes = (
  params: BuscarExpedientesParams = {}
): UsePendentesResult => {
  const [expedientes, setExpedientes] = useState<PendenteManifestacao[]>([]);
  const [paginacao, setPaginacao] = useState<UsePendentesResult['paginacao']>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Serializar params para evitar loops infinitos por mudanças de referência
  const paramsKey = JSON.stringify(params);

  const buscarExpedientes = useCallback(async () => {
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
            // Converter 'baixado' para query string apropriada
            if (key === 'baixado') {
              searchParams.set('baixado', value.toString());
            } else {
              searchParams.set(key, value.toString());
            }
          } else if (value === 'null') {
            searchParams.set(key, 'null');
          } else {
            searchParams.set(key, String(value));
          }
        }
      });

      const response = await fetch(
        `/api/pendentes-manifestacao?${searchParams.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Erro desconhecido',
        }));
        throw new Error(
          errorData.error || `Erro ${response.status}: ${response.statusText}`
        );
      }

      const data: ExpedientesApiResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setExpedientes(data.data.pendentes);
      setPaginacao(data.data.paginacao);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao buscar expedientes';
      setError(errorMessage);
      setExpedientes([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    buscarExpedientes();
  }, [buscarExpedientes]);

  return {
    expedientes,
    paginacao,
    isLoading,
    error,
    refetch: buscarExpedientes,
  };
};

