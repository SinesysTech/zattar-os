'use client';

import useSWR from 'swr';
import type {
  ConciliacaoBancaria,
  ConciliacaoResult,
  ConciliarAutomaticaDTO,
  ConciliarManualDTO,
  ImportarExtratoDTO,
  ImportarExtratoResponse,
  ListarTransacoesImportadasParams,
  ListarTransacoesResponse,
  TransacaoComConciliacao,
  SugestaoConciliacao,
  LancamentoFinanceiroResumo,
} from '@/backend/types/financeiro/conciliacao-bancaria.types';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro na requisi\u00e7\u00e3o');
  }
  return res.json();
};

// ----------------------------------------------------------------------------
// Listagens
// ----------------------------------------------------------------------------

export const useTransacoesImportadas = (
  params: ListarTransacoesImportadasParams = {}
) => {
  const searchParams = new URLSearchParams();
  if (params.pagina) searchParams.set('pagina', params.pagina.toString());
  if (params.limite) searchParams.set('limite', params.limite.toString());
  if (params.contaBancariaId) searchParams.set('contaBancariaId', params.contaBancariaId.toString());
  if (params.dataInicio) searchParams.set('dataInicio', params.dataInicio);
  if (params.dataFim) searchParams.set('dataFim', params.dataFim);
  if (params.busca) searchParams.set('busca', params.busca);
  if (params.tipoTransacao) searchParams.set('tipoTransacao', params.tipoTransacao);
  if (params.ordenarPor) searchParams.set('ordenarPor', params.ordenarPor);
  if (params.ordem) searchParams.set('ordem', params.ordem);
  if (params.statusConciliacao) {
    if (Array.isArray(params.statusConciliacao)) {
      params.statusConciliacao.forEach((s) => searchParams.append('statusConciliacao', s));
    } else {
      searchParams.set('statusConciliacao', params.statusConciliacao);
    }
  }

  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: ListarTransacoesResponse }>(
    `/api/financeiro/conciliacao-bancaria/transacoes?${searchParams.toString()}`,
    fetcher
  );

  return {
    transacoes: data?.data.items || [],
    paginacao: data?.data.paginacao,
    resumo: data?.data.resumo,
    isLoading,
    error: error ? error.message : null,
    refetch: () => mutate(),
  };
};

export const buscarLancamentosManuais = async (params: {
  busca?: string;
  dataInicio?: string;
  dataFim?: string;
  contaBancariaId?: number;
  tipo?: 'receita' | 'despesa';
  limite?: number;
}): Promise<LancamentoFinanceiroResumo[]> => {
  const searchParams = new URLSearchParams();
  if (params.busca) searchParams.set('busca', params.busca);
  if (params.dataInicio) searchParams.set('dataInicio', params.dataInicio);
  if (params.dataFim) searchParams.set('dataFim', params.dataFim);
  if (params.contaBancariaId) searchParams.set('contaBancariaId', params.contaBancariaId.toString());
  if (params.tipo) searchParams.set('tipo', params.tipo);
  if (params.limite) searchParams.set('limite', params.limite.toString());

  const response = await fetch(`/api/financeiro/conciliacao-bancaria/lancamentos?${searchParams.toString()}`);
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Erro ao buscar lancamentos');
  }

  return data.data as LancamentoFinanceiroResumo[];
};

export const useTransacaoDetalhes = (id: number | null) => {
  const enabled = !!id;
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: TransacaoComConciliacao }>(
    enabled ? `/api/financeiro/conciliacao-bancaria/transacoes/${id}` : null,
    fetcher
  );

  return {
    transacao: data?.data || null,
    isLoading,
    error: error ? error.message : null,
    refetch: () => mutate(),
  };
};

export const useSugestoesConciliacao = (transacaoId: number | null) => {
  const enabled = !!transacaoId;
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: SugestaoConciliacao[] }>(
    enabled ? `/api/financeiro/conciliacao-bancaria/sugestoes/${transacaoId}` : null,
    fetcher
  );

  return {
    sugestoes: data?.data || [],
    isLoading,
    error: error ? error.message : null,
    refetch: () => mutate(),
  };
};

// ----------------------------------------------------------------------------
// Mutacoes
// ----------------------------------------------------------------------------

export const importarExtrato = async (
  dto: ImportarExtratoDTO
): Promise<ImportarExtratoResponse> => {
  const formData = new FormData();
  formData.append('contaBancariaId', dto.contaBancariaId.toString());
  formData.append('tipoArquivo', dto.tipoArquivo);
  formData.append('arquivo', dto.arquivo as Blob);

  const response = await fetch('/api/financeiro/conciliacao-bancaria/importar', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Erro ao importar extrato');
  }

  return data.data as ImportarExtratoResponse;
};

export const conciliarManual = async (
  dto: ConciliarManualDTO
): Promise<ConciliacaoBancaria> => {
  const response = await fetch('/api/financeiro/conciliacao-bancaria/conciliar-manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Erro ao conciliar manualmente');
  }

  return data.data as ConciliacaoBancaria;
};

export const conciliarAutomaticamente = async (
  dto: ConciliarAutomaticaDTO
): Promise<ConciliacaoResult[]> => {
  const response = await fetch('/api/financeiro/conciliacao-bancaria/conciliar-automaticamente', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Erro ao conciliar automaticamente');
  }

  return data.data as ConciliacaoResult[];
};

export const desconciliar = async (transacaoId: number): Promise<void> => {
  const response = await fetch(`/api/financeiro/conciliacao-bancaria/transacoes/${transacaoId}/desconciliar`, {
    method: 'POST',
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Erro ao desconciliar transa\u00e7\u00e3o');
  }
};
