'use client';

/**
 * useContratosStats — Hook para estatísticas agregadas do módulo de contratos.
 *
 * Estratégia:
 *  - Chama actionContratosStats() na montagem do componente
 *  - Retorna { stats, isLoading, error, refetch }
 *
 * USO:
 *   const { stats, isLoading } = useContratosStats();
 *   if (stats) console.log(stats.total, stats.taxaConversao);
 */

import { useState, useEffect, useCallback } from 'react';
import { actionContratosStats } from '../actions/contratos-actions';
import type { ContratosStatsData } from '../domain';

// =============================================================================
// TYPES
// =============================================================================

export interface UseContratosStatsResult {
  stats: ContratosStatsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

export function useContratosStats(): UseContratosStatsResult {
  const [stats, setStats] = useState<ContratosStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionContratosStats();

      if (!result.success) {
        throw new Error(result.error ?? 'Erro ao buscar estatísticas');
      }

      setStats(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
}
