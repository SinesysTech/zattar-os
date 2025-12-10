import useSWR from 'swr';
import { actionListarLancamentos, actionExcluirLancamento, actionCancelarLancamento, ListarLancamentosResult } from '../actions/lancamentos';
import { ListarLancamentosParams } from '../types/lancamentos';

/**
 * Hook para gerenciar contas a pagar (lançamentos do tipo 'despesa')
 */
export function useContasPagar(params: Partial<ListarLancamentosParams>) {
    const key = ['contas-pagar', JSON.stringify(params)];

    const fetcher = async (): Promise<ListarLancamentosResult> => {
        const result = await actionListarLancamentos({ ...params, tipo: 'despesa' });
        if (!result.success) throw new Error(result.error);
        return result.data;
    };

    const { data, error, isLoading, mutate } = useSWR(key, fetcher);

    return {
        contasPagar: data?.dados || [],
        paginacao: data?.meta,
        resumoVencimentos: data?.resumo,
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Erro ao carregar') : null,
        refetch: mutate
    };
}

/**
 * Cancela uma conta a pagar
 */
export async function cancelarConta(id: number) {
    const result = await actionCancelarLancamento(id);
    if (!result.success) throw new Error(result.error);
    return result;
}

/**
 * Exclui uma conta a pagar
 */
export async function excluirConta(id: number) {
    const result = await actionExcluirLancamento(id);
    if (!result.success) throw new Error(result.error);
    return result;
}
