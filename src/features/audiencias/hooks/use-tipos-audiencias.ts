'use client';

/**
 * Hook para buscar tipos de audiências
 */

import { useState, useEffect, useCallback } from 'react';
import type { TipoAudiencia, UseTiposAudienciasResult } from '../types';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Construct query parameters
      const queryParams = new URLSearchParams();
      if (params?.trt) queryParams.append('trt', params.trt);
      if (params?.grau) queryParams.append('grau', params.grau);
      if (params?.limite) queryParams.append('limite', params.limite.toString());

      const url = `/api/audiencias/tipos?${queryParams.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTiposAudiencia(data.data || []);
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
