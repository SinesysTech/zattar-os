import useSWR from 'swr';
import { actionListarLancamentos, actionExcluirLancamento, actionCancelarLancamento } from '../actions/lancamentos';
import { ListarLancamentosParams, Lancamento } from '../types/lancamentos';

export function useContasPagar(params: Partial<ListarLancamentosParams>) {
    const key = ['contas-pagar', JSON.stringify(params)];

    const fetcher = async () => {
        const result = await actionListarLancamentos({ ...params, tipo: 'despesa' });
        if (!result.success) throw new Error(result.error);
        return result.data;
    };

    const { data, error, isLoading, mutate } = useSWR(key, fetcher);

    return {
        contasPagar: data?.dados || [],
        paginacao: data?.meta,
        resumoVencimentos: data?.resumo, // Assuming backend returns this, otherwise separate action
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Erro ao carregar') : null,
        refetch: mutate
    };
}

export async function cancelarConta(id: number) {
    return actionCancelarLancamento(id);
}

export async function excluirConta(id: number) {
    return actionExcluirLancamento(id);
}
