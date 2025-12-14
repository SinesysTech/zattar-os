'use client';

import { useState, useEffect, useCallback } from 'react';
import { listAllConfigs } from '../services/persistence/tribunal-config-persistence.service';
import type { TribunalConfigDb } from '../types/trt-types';

/**
 * Hook para buscar e gerenciar configurações de tribunais
 */
export function useTribunais() {
  const [tribunais, setTribunais] = useState<TribunalConfigDb[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTribunais = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const configs = await listAllConfigs();
      setTribunais(configs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tribunais');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTribunais();
  }, [fetchTribunais]);

  return {
    tribunais,
    isLoading,
    error,
    refetch: fetchTribunais,
  };
}

