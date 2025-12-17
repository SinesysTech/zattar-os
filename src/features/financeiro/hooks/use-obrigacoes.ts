'use client';

import useSWR from 'swr';
import {
    actionListarObrigacoes,
    actionObterResumoObrigacoes,
    actionSincronizarAcordo,
    actionSincronizarParcela,
    ObterResumoObrigacoesResult
} from '../actions/obrigacoes';
import { ObrigacoesFilters } from '../types/obrigacoes';

/**
 * Hook para listar obrigações com paginação e resumo
 */
export function useObrigacoes(params: Partial<ObrigacoesFilters> & { pagina?: number; limite?: number; busca?: string }) {
    const key = ['obrigacoes', JSON.stringify(params)];

    const fetcher = async () => {
        const result = await actionListarObrigacoes(params);
        if (!result.success) throw new Error(result.error);
        return result.data;
    };

    const { data, error, isLoading, mutate } = useSWR(key, fetcher);

    return {
        obrigacoes: data?.dados || [],
        paginacao: data?.meta,
        resumo: data?.resumo,
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Erro ao carregar') : null,
        refetch: mutate
    };
}

/**
 * Hook para obter resumo de obrigações com alertas
 */
export function useResumoObrigacoes(params?: Partial<ObrigacoesFilters>) {
    const key = ['obrigacoes-resumo', JSON.stringify(params)];

    const fetcher = async (): Promise<ObterResumoObrigacoesResult> => {
        const result = await actionObterResumoObrigacoes();
        if (!result.success) throw new Error(result.error);
        return result.data;
    };

    const { data, error, isLoading, mutate } = useSWR(key, fetcher);

    return {
        alertas: data?.alertas || [],
        resumo: data?.resumo || {
            totalVencidas: 0,
            valorTotalVencido: 0,
            totalPendentes: 0,
            valorTotalPendente: 0,
            totalRepassesPendentes: 0,
            valorRepassesPendentes: 0
        },
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Erro ao carregar') : null,
        refetch: mutate
    };
}

/**
 * Sincroniza todas as parcelas de um acordo
 */
export async function sincronizarAcordo(acordoId: number, forcar: boolean = false) {
    const result = await actionSincronizarAcordo(acordoId, forcar);
    if (!result.success) throw new Error(result.error);
    return result;
}

/**
 * Sincroniza uma parcela específica
 */
export async function sincronizarParcela(parcelaId: number, forcar: boolean = false) {
    const result = await actionSincronizarParcela(parcelaId, forcar);
    if (!result.success) throw new Error(result.error);
    return result;
}
