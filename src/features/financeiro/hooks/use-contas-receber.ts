'use client';

import useSWR from 'swr';
import { actionListarLancamentos, actionExcluirLancamento, actionCancelarLancamento, actionBuscarLancamento, ListarLancamentosResult } from '../actions/lancamentos';
import { ListarLancamentosParams } from '../types/lancamentos';

/**
 * Hook para gerenciar contas a receber (lançamentos do tipo 'receita')
 */
export function useContasReceber(params: Partial<ListarLancamentosParams>) {
    const key = ['contas-receber', JSON.stringify(params)];

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

    return {
        conta: data ?? null,
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Erro ao carregar') : null,
        refetch: mutate,
    };
}
