'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { actionObterFluxoCaixaUnificado } from '../../actions/financeiro/dashboard/actionObterFluxoCaixaUnificado';

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
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const hoje = new Date();
    // Inicio: 6 meses atras
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - meses, 1);
    // Fim: 6 meses no futuro
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 6, 0);

    actionObterFluxoCaixaUnificado(inicio.toISOString(), fim.toISOString())
      .then((res: any) => {
        if (res.sucesso) {
          const dadosGrafico = transformToChartData(res.data);
          setData(dadosGrafico);
        } else {
          setError(res.erro);
        }
      })
      .catch((err: any) => setError(err))
      .finally(() => setLoading(false));
  }, [meses]);

  return {
    data,
    isLoading: loading,
    error,
    isValidating: loading,
    mutate: () => { },
  };
};

function transformToChartData(fluxoUnificado: any): any[] {
  // Mock ou adaptação real dos dados
  // Se fluxoUnificado vier zerado ou nulo, evitar erro
  if (!fluxoUnificado) return [];

  return [
    { mes: 'Atual', receitas: fluxoUnificado.realizado?.receitas || 0, despesas: fluxoUnificado.realizado?.despesas || 0 },
    { mes: 'Projetado', receitas: fluxoUnificado.projetado?.receitas || 0, despesas: fluxoUnificado.projetado?.despesas || 0 }
  ];
}

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
