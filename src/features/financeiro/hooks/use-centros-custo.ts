'use client';

import useSWR from 'swr';
import { actionListarCentrosCustoAtivos } from '../actions/auxiliares';

type CentroCustoUI = {
  id: number;
  nome: string;
  codigo: string;
  ativo: boolean;
};

export function useCentrosCustoAtivos() {
  const fetcher = async () => {
    const result = await actionListarCentrosCustoAtivos();
    if (!result.success) throw new Error(result.error || 'Erro ao listar centros de custo');
    return (result.data || []) as CentroCustoUI[];
  };

  const { data, error, isLoading, mutate } = useSWR('financeiro:centros_custo', fetcher);

  return {
    centrosCusto: data ?? [],
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Erro ao carregar') : null,
    refetch: mutate,
  };
}

export function useCentrosCusto(_options?: { ativos?: boolean; limite?: number }) {
  // Por enquanto, a action já retorna apenas ativos; mantemos assinatura compatível com a UI.
  return useCentrosCustoAtivos();
}





