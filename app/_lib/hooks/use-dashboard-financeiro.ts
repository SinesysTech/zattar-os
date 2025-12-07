'use client';

import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText);
  }
  return res.json();
};

export const useDashboardFinanceiro = () => {
  const { data, error, isValidating, mutate } = useSWR('/api/financeiro/dashboard', fetcher, {
    refreshInterval: 30000,
  });

  return {
    data: data?.data,
    isLoading: !data && !error,
    error,
    isValidating,
    mutate,
  };
};

export const useSaldoContas = () => {
  const dash = useDashboardFinanceiro();
  return {
    ...dash,
    saldoAtual: dash.data?.metricas?.saldoAtual ?? 0,
  };
};

export const useContasPagarReceber = () => {
  const dash = useDashboardFinanceiro();
  return {
    ...dash,
    contasPagar: dash.data?.metricas?.contasPagarPendentes || { quantidade: 0, valor: 0 },
    contasReceber: dash.data?.metricas?.contasReceberPendentes || { quantidade: 0, valor: 0 },
  };
};

export const useFluxoCaixa = (meses: number = 6) => {
  const { data, error, isValidating, mutate } = useSWR(
    `/api/financeiro/dashboard/fluxo-caixa?meses=${meses}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  return {
    data: data?.data || [],
    isLoading: !data && !error,
    error,
    isValidating,
    mutate,
  };
};

export const useDespesasPorCategoria = () => {
  const dash = useDashboardFinanceiro();
  return {
    ...dash,
    despesasPorCategoria: dash.data?.metricas?.despesasPorCategoria || [],
  };
};

export const useOrcamentoAtual = () => {
  const dash = useDashboardFinanceiro();
  return {
    ...dash,
    orcamentoAtual: dash.data?.metricas?.orcamentoAtual || null,
  };
};

export const useAlertasFinanceiros = () => {
  const dash = useDashboardFinanceiro();
  return {
    ...dash,
    alertas: dash.data?.alertas || [],
  };
};
