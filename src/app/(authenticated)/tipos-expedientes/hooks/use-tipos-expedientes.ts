/**
 * React Hooks for Tipos Expedientes
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { ListarTiposExpedientesParams, TipoExpediente } from '../domain';
import { actionListarTiposExpedientes } from '../actions/tipos-expedientes-actions';

// Ensure this matches the Action result type
interface UseTiposExpedientesResult {
  tiposExpedientes: TipoExpediente[];
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

export const useTiposExpedientes = (params: ListarTiposExpedientesParams = {}): UseTiposExpedientesResult => {
  const [tiposExpedientes, setTiposExpedientes] = useState<TipoExpediente[]>([]);
  const [paginacao, setPaginacao] = useState<UseTiposExpedientesResult['paginacao']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract primitive values for stable dependency array
  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const busca = params.busca || '';
  const ordenarPor = params.ordenarPor;
  const ordem = params.ordem;

  // Memoize params key to avoid loops
  const paramsKey = useMemo(() => {
    return JSON.stringify({
      pagina,
      limite,
      busca,
      ordenarPor,
      ordem,
    });
  }, [pagina, limite, busca, ordenarPor, ordem]);

  const paramsRef = useRef<string>('');

  const buscarTiposExpedientes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarTiposExpedientes({
        pagina,
        limite,
        busca,
        ordenarPor,
        ordem,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao buscar tipos de expedientes');
      }

      // Check structure based on result type
      const { data, meta } = result.data;

      setTiposExpedientes(data || []);
      setPaginacao(meta || null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao buscar tipos de expedientes';
      setError(errorMessage);
      setTiposExpedientes([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [pagina, limite, busca, ordenarPor, ordem]);

  useEffect(() => {
    if (paramsRef.current !== paramsKey) {
      paramsRef.current = paramsKey;
      buscarTiposExpedientes();
    }
  }, [paramsKey, buscarTiposExpedientes]);

  return {
    tiposExpedientes,
    paginacao,
    isLoading,
    error,
    refetch: buscarTiposExpedientes,
  };
};
