import useSWR from 'swr';
import { actionListarLancamentos, actionExcluirLancamento, actionCancelarLancamento } from '../actions/lancamentos';
import { ListarLancamentosParams } from '../types/lancamentos';

export function useContasReceber(params: Partial<ListarLancamentosParams>) {
    const key = ['contas-receber', JSON.stringify(params)];

    const fetcher = async () => {
        const result = await actionListarLancamentos({ ...params, tipo: 'receita' });
        if (!result.success) throw new Error(result.error);
        return result.data;
    };

    const { data, error, isLoading, mutate } = useSWR(key, fetcher);

    return {
        contasReceber: data?.dados || [],
        paginacao: data?.meta,
        resumoInadimplencia: data?.resumo, // Assuming backend returns this, otherwise separate action
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Erro ao carregar') : null,
        refetch: mutate
    };
}
