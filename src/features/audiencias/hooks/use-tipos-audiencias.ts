'use client';

/**
 * Hook para buscar tipos de audiências
 */

import { useState, useEffect, useCallback } from 'react';
import type { TipoAudiencia, UseTiposAudienciasResult } from '../domain';
import { actionListarTiposAudiencia } from '../actions';

// Verificação SSR - retorna true se estiver rodando no cliente
const isClient = typeof window !== 'undefined';

interface UseTiposAudienciasParams {
  trt?: string;
  grau?: string;
  limite?: number;
}

/**
 * Hook para buscar tipos de audiências disponíveis
 */
export function useTiposAudiencias(
  params?: UseTiposAudienciasParams
): UseTiposAudienciasResult & { refetch: () => void } {
  const [tiposAudiencia, setTiposAudiencia] = useState<TipoAudiencia[]>([]);
  const [isLoading, setIsLoading] = useState(isClient);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    // Não executar durante SSR/SSG
    if (!isClient) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Construct query parameters
      const queryParams = new URLSearchParams();
      if (params?.trt) queryParams.append('trt', params.trt);
      if (params?.grau) queryParams.append('grau', params.grau);
      if (params?.limite) queryParams.append('limite', params.limite.toString());

      const result = await actionListarTiposAudiencia({
        trt: params?.trt,
        grau: params?.grau,
        limite: params?.limite,
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar tipos de audiência.');
      }

      setTiposAudiencia((result.data as unknown as TipoAudiencia[]) || []);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Erro ao carregar tipos de audiência.';
      setError(errorMessage);
      setTiposAudiencia([]);
    } finally {
      setIsLoading(false);
    }
  }, [params?.trt, params?.grau, params?.limite]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { tiposAudiencia, isLoading, error, refetch };
}
