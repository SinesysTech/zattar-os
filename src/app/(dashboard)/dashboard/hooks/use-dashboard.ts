'use client';

/**
 * Hook para buscar dados da dashboard
 *
 * Migrado de: src/app/_lib/hooks/use-dashboard.ts
 * Agora usa Server Actions em vez de API REST
 */

import { useState, useEffect, useCallback } from 'react';
import { actionObterDashboard } from '../actions';
import type {
  DashboardData,
  DashboardUsuarioData,
  DashboardAdminData,
} from '../domain';

interface UseDashboardResult {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isAdmin: boolean;
}

/**
 * Hook para buscar dados da dashboard personalizada
 *
 * @example
 * const { data, isLoading, error, isAdmin, refetch } = useDashboard();
 *
 * if (isLoading) return <LoadingSkeleton />;
 * if (error) return <ErrorMessage message={error} />;
 *
 * if (isAdmin) {
 *   const adminData = data as DashboardAdminData;
 *   // Renderizar dashboard de admin
 * } else {
 *   const userData = data as DashboardUsuarioData;
 *   // Renderizar dashboard de usuário
 * }
 */
export function useDashboard(): UseDashboardResult {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionObterDashboard();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Erro ao buscar dados da dashboard');
        setData(null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao buscar dados da dashboard';
      setError(errorMessage);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const isAdmin = data?.role === 'admin';

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboard,
    isAdmin,
  };
}

/**
 * Type guard para verificar se é DashboardAdminData
 */
export function isDashboardAdmin(
  data: DashboardData | null
): data is DashboardAdminData {
  return data?.role === 'admin';
}

/**
 * Type guard para verificar se é DashboardUsuarioData
 */
export function isDashboardUsuario(
  data: DashboardData | null
): data is DashboardUsuarioData {
  return data?.role === 'user';
}
