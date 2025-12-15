/**
 * React Hooks for Advogados Feature
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Advogado, ListarAdvogadosParams, ListarAdvogadosResult } from '../domain';
import { actionListarAdvogados } from '../actions/advogados-actions';

interface UseAdvogadosResult {
  advogados: Advogado[];
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
 * Hook para buscar advogados
 */
export const useAdvogados = (params: ListarAdvogadosParams = {}): UseAdvogadosResult => {
  const [advogados, setAdvogados] = useState<Advogado[]>([]);
  const [paginacao, setPaginacao] = useState<UseAdvogadosResult['paginacao']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarAdvogados = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarAdvogados(params);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao buscar advogados');
      }

      // Type assertion since we know the structure from the action
      const data = result.data as ListarAdvogadosResult;

      setAdvogados(data.advogados);
      setPaginacao({
        pagina: data.pagina,
        limite: data.limite,
        total: data.total,
        totalPaginas: data.totalPaginas,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar advogados';
      setError(errorMessage);
      setAdvogados([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    params.pagina,
    params.limite,
    params.busca,
    params.oab,
    params.uf_oab,
    params.com_credenciais,
  ]);

  useEffect(() => {
    buscarAdvogados();
  }, [buscarAdvogados]);

  return {
    advogados,
    paginacao,
    isLoading,
    error,
    refetch: buscarAdvogados,
  };
};
