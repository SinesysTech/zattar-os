/**
 * Hook para gerenciar cargos
 */

import useSWR from 'swr';
import type { Cargo, ListarCargosResponse } from '@/backend/types/cargos/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UseCargosParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  ativo?: boolean;
  ordenarPor?: 'nome' | 'created_at' | 'updated_at';
  ordem?: 'asc' | 'desc';
}

/**
 * Hook para listar cargos com filtros e paginação
 */
export function useCargos(params: UseCargosParams = {}) {
  const {
    pagina = 1,
    limite = 50,
    busca,
    ativo,
    ordenarPor = 'nome',
    ordem = 'asc',
  } = params;

  // Construir query string
  const queryParams = new URLSearchParams();
  queryParams.set('pagina', pagina.toString());
  queryParams.set('limite', limite.toString());
  queryParams.set('ordenarPor', ordenarPor);
  queryParams.set('ordem', ordem);

  if (busca) {
    queryParams.set('busca', busca);
  }

  if (ativo !== undefined) {
    queryParams.set('ativo', ativo.toString());
  }

  const url = `/api/cargos?${queryParams.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: ListarCargosResponse;
  }>(url, fetcher);

  return {
    cargos: data?.data.items || [],
    paginacao: data?.data.paginacao,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook simplificado para buscar todos os cargos ativos
 * Útil para dropdowns e selects
 */
export function useCargosAtivos() {
  const { cargos, isLoading, error, mutate } = useCargos({
    ativo: true,
    limite: 100,
    ordenarPor: 'nome',
    ordem: 'asc',
  });

  return {
    cargos,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook para buscar um cargo específico por ID
 */
export function useCargo(id: number | null) {
  const url = id ? `/api/cargos/${id}` : null;

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: Cargo;
  }>(url, fetcher);

  return {
    cargo: data?.data,
    isLoading,
    error,
    mutate,
  };
}
