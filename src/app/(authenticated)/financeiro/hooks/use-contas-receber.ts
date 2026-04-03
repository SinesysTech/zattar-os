'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { actionListarLancamentos, actionExcluirLancamento, actionCancelarLancamento, actionBuscarLancamento, ListarLancamentosResult } from '../actions/lancamentos';
import { ListarLancamentosParams } from '../types/lancamentos';
import { useDeepCompareMemo } from '@/hooks/use-render-count';

/**
 * Serializa parâmetros de forma estável (sempre mesma ordem de chaves)
 * para evitar re-fetches desnecessários
 */
function serializeParams(params: unknown): string {
  if (typeof params !== 'object' || params === null) {
    return JSON.stringify(params);
  }

  // Ordenar chaves alfabeticamente antes de stringify
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = (params as Record<string, unknown>)[key];
      return acc;
    }, {} as Record<string, unknown>);

  return JSON.stringify(sortedParams);
}

/**
 * Hook para gerenciar contas a receber (lançamentos do tipo 'receita')
 */
export function useContasReceber(params: Partial<ListarLancamentosParams>) {
    // Estabilizar params com comparação profunda
    const stableParams = useDeepCompareMemo(() => params, [params]);

    // Serializar params estáveis
    const serializedParams = useMemo(() => serializeParams(stableParams), [stableParams]);

    // Usar serializedParams estável para criar a key do SWR
    // Isso evita re-fetches quando params tem mesmos valores mas referência diferente
    const key = useMemo(
        () => ['contas-receber', serializedParams],
        [serializedParams]
    );

    const fetcher = async (): Promise<ListarLancamentosResult> => {
        const result = await actionListarLancamentos({ ...params, tipo: 'receita' });
        if (!result.success) throw new Error(result.error);
        return result.data;
    };

    const { data, error, isLoading, mutate } = useSWR(key, fetcher);

    return {
        contasReceber: data?.dados || [],
        paginacao: data?.meta,
        resumoInadimplencia: data?.resumo,
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Erro ao carregar') : null,
        refetch: mutate
    };
}

/**
 * Cancela uma conta a receber
 */
export async function cancelarContaReceber(id: number) {
    const result = await actionCancelarLancamento(id);
    if (!result.success) throw new Error(result.error);
    return result;
}

/**
 * Exclui uma conta a receber
 */
export async function excluirContaReceber(id: number) {
    const result = await actionExcluirLancamento(id);
    if (!result.success) throw new Error(result.error);
    return result;
}

export function useContaReceber(id: number) {
    const key = id ? ['conta-receber', id] : null;

    const fetcher = async () => {
        const result = await actionBuscarLancamento(id);
        if (!result.success) throw new Error(result.error);
        return result.data;
    };

    const { data, error, isLoading, mutate } = useSWR(key, fetcher);

    const conta = data ?? null;
    return {
        conta,
        contaReceber: conta,
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Erro ao carregar') : null,
        refetch: mutate,
    };
}
