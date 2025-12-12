'use client';

import useSWR from 'swr';
import { actionListarContasBancariasAtivas } from '../actions/auxiliares';

type ContaBancariaUI = {
  id: number;
  nome: string;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  ativo: boolean;
};

export function useContasBancarias(_options?: { ativos?: boolean }) {
  const fetcher = async () => {
    const result = await actionListarContasBancariasAtivas();
    if (!result.success) throw new Error(result.error || 'Erro ao listar contas bancárias');
    return (result.data || []) as ContaBancariaUI[];
  };

  const { data, error, isLoading, mutate } = useSWR('financeiro:contas_bancarias', fetcher);

  return {
    contasBancarias: data ?? [],
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Erro ao carregar') : null,
    refetch: mutate,
  };
}



