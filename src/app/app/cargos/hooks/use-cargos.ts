/**
 * React Hooks for Cargos Feature
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Cargo, ListarCargosParams, ListarCargosResponse } from '../types';
import { actionListarCargos } from '../actions/cargos-actions';

interface UseCargosResult {
  cargos: Cargo[];
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

export const useCargos = (params: ListarCargosParams = {}): UseCargosResult => {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [paginacao, setPaginacao] = useState<UseCargosResult['paginacao']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarCargos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarCargos(params);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao buscar cargos');
      }

      const data = result.data as unknown as ListarCargosResponse;
      setCargos(data.items);
      setPaginacao(data.paginacao);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar cargos';
      setError(errorMessage);
      setCargos([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.pagina,
    params.limite,
    params.busca,
    params.ativo,
    params.ordenarPor,
    params.ordem,
  ]);

  useEffect(() => {
    buscarCargos();
  }, [buscarCargos]);

  return {
    cargos,
    paginacao,
    isLoading,
    error,
    refetch: buscarCargos,
  };
};
