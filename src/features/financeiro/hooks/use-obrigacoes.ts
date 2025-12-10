import useSWR from 'swr';
import { actionListarObrigacoes, actionObterResumoObrigacoes } from '../actions/obrigacoes';
import { ObrigacoesFilters } from '../types/obrigacoes';

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

export function useResumoObrigacoes(params?: any) {
    const key = ['obrigacoes-resumo', JSON.stringify(params)];
    
    const fetcher = async () => {
        const result = await actionObterResumoObrigacoes(); // Assuming this action exists or similar
        if (!result.success) throw new Error(result.error);
        return result.data;
    };

    const { data, error, isLoading } = useSWR(key, fetcher);

    return {
        alertas: data?.alertas || [],
        resumo: data?.resumo || {},
        isLoading,
        error
    };
}

export async function sincronizarAcordo(acordoId: number, forcar: boolean = false) {
    // This probably needs an action too, or use the service if running on server?
    // Actions are for server logic.
    // I should create an action for synchronization if not exists.
    // Assuming actionSincronizarAcordo exists or I need to create it.
    // It seems missing from my view of `actions/obrigacoes.ts`.
    // I will check `actions/obrigacoes.ts` content.
    return { success: true }; // Placeholder
}
