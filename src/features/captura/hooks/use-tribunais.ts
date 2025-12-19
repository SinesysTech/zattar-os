'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TribunalConfigDb } from '../types/trt-types';

interface TribunaisResponse {
  success: boolean;
  data?: {
    tribunais: TribunalConfigDb[];
    tribunais_codigos: string[];
    tipos_acesso: string[];
  };
  error?: string;
}

/**
 * Hook para buscar e gerenciar configurações de tribunais
 * Usa a API route /api/captura/tribunais para buscar dados
 */
export function useTribunais() {
  const [tribunais, setTribunais] = useState<TribunalConfigDb[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTribunais = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/captura/tribunais');

      if (!response.ok) {
        throw new Error('Erro ao buscar configurações de tribunais');
      }

      const data: TribunaisResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Erro ao buscar configurações de tribunais');
      }

      setTribunais(data.data.tribunais);
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
