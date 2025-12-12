import useSWR from 'swr';
import { 
    actionListarTransacoes, 
    actionConciliarManual, 
    actionConciliarAutomaticamente,
    actionDesconciliar,
    actionBuscarTransacao,
    actionObterSugestoes
} from '../actions/conciliacao';
import { ConciliacaoFilters, ConciliarManualDTO, ConciliarAutomaticaDTO } from '../types/conciliacao';

export function useTransacoesImportadas(params: Partial<ConciliacaoFilters> & { pagina?: number; limite?: number; busca?: string }) {
    const key = ['conciliacao-transacoes', JSON.stringify(params)];

    const fetcher = async () => {
        const result = await actionListarTransacoes(params);
        if (!result.success) throw new Error(result.error);
        return result.data;
    };

    const { data, error, isLoading, mutate } = useSWR(key, fetcher);

    return {
        transacoes: data?.dados || [],
        resumo: data?.resumo,
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Erro ao carregar') : null,
        refetch: mutate
    };
}

export function useTransacaoDetalhes(transacaoId: number) {
    const key = transacaoId ? ['conciliacao-transacao', transacaoId] : null;

    const fetcher = async () => {
        const result = await actionBuscarTransacao(transacaoId);
        if (!result.success) throw new Error(result.error);
        return result.data;
    };

    const { data, error, isLoading, mutate } = useSWR(key, fetcher);

    return {
        transacao: data ?? null,
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Erro ao carregar') : null,
        refetch: mutate,
    };
}

export function useSugestoesConciliacao(transacaoId: number) {
    const key = transacaoId ? ['conciliacao-sugestoes', transacaoId] : null;

    const fetcher = async () => {
        const result = await actionObterSugestoes(transacaoId);
        if (!result.success) throw new Error(result.error);
        return result.data;
    };

    const { data, error, isLoading, mutate } = useSWR(key, fetcher);

    return {
        sugestoes: data ?? [],
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Erro ao carregar') : null,
        refetch: mutate,
    };
}

export async function conciliarManual(dto: ConciliarManualDTO) {
    const result = await actionConciliarManual(dto);
    if (!result.success) throw new Error(result.error);
    return result.data;
}

export async function conciliarAutomaticamente(params: ConciliarAutomaticaDTO) {
    const result = await actionConciliarAutomaticamente(params);
    if (!result.success) throw new Error(result.error);
    return []; // Return mocked results for now
}

export async function desconciliar(id: number) {
    const result = await actionDesconciliar(id);
    if (!result.success) throw new Error(result.error);
    return true;
}
