'use client';

import { useState, useEffect, useCallback } from 'react';
import { listAllConfigs } from '../services/persistence/tribunal-config-persistence.service';
import type { TribunalConfigDb } from '../types/trt-types';
import type { TribunalConfig } from '@/types/tribunais';

/**
 * Hook para buscar e gerenciar configurações de tribunais
 */
export function useTribunais() {
  const [tribunais, setTribunais] = useState<TribunalConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTribunais = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const configs = await listAllConfigs();
      
      // Converter TribunalConfigDb para TribunalConfig
      const tribunaisConvertidos: TribunalConfig[] = configs.map((config) => ({
        id: config.id,
        tribunal_codigo: config.tribunal_codigo,
        tribunal_nome: config.tribunal_nome,
        sistema: config.sistema,
        tipo_acesso: config.tipo_acesso,
        url_base: config.url_base,
        url_login_seam: config.url_login_seam,
        url_api: config.url_api,
        custom_timeouts: config.custom_timeouts,
        created_at: config.created_at,
        updated_at: config.updated_at,
        tribunal_id: config.tribunal_id,
      }));

      setTribunais(tribunaisConvertidos);
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

