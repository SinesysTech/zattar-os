'use client';

/**
 * Hooks para dados financeiros do dashboard
 *
 * Migrado de: src/app/_lib/hooks/use-dashboard-financeiro.ts
 * Consome Server Actions do módulo financeiro
 */

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { actionObterDashboardFinanceiro, actionObterFluxoCaixaUnificado, actionObterTopCategorias } from '@/features/financeiro';

// ============================================================================
// Types
// ============================================================================

interface FluxoCaixaChartData {
  mes: string;
  receitas: number;
  despesas: number;
  saldo?: number;
}

interface FluxoCaixaPeriodo {
  periodo?: string;
  mes?: string;
  entradas?: number;
  receitas?: number;
  saidas?: number;
  despesas?: number;
  saldo?: number;
}

interface FluxoCaixaTotais {
  receitas?: number;
  entradas?: number;
  despesas?: number;
  saidas?: number;
}

interface FluxoCaixaUnificado {
  periodos?: FluxoCaixaPeriodo[];
  realizado?: FluxoCaixaTotais;
  projetado?: FluxoCaixaTotais;
}

interface CategoriaValor {
  categoria: string;
  valor: number;
}

// ============================================================================
// Dashboard Financeiro Principal
// ============================================================================

const dashboardFetcher = async () => {
  const result = await actionObterDashboardFinanceiro();
  if (!result.success) throw new Error(result.error);
  return result.data;
};

export function useDashboardFinanceiro() {
  const { data, error, isValidating, mutate } = useSWR(
    'dashboard-financeiro',
    dashboardFetcher,
    {
      refreshInterval: 30000, // 30 segundos
      revalidateOnFocus: false,
    }
  );

  return {
    data,
    isLoading: !data && !error,
    error,
    isValidating,
    mutate,
  };
}

// ============================================================================
// Saldo de Contas
// ============================================================================

export function useSaldoContas() {
  const dash = useDashboardFinanceiro();

  return {
    ...dash,
    saldoAtual: dash.data?.saldoMes ?? 0,
  };
}

// ============================================================================
// Contas a Pagar/Receber
// ============================================================================

export function useContasPagarReceber() {
  const dash = useDashboardFinanceiro();

  return {
    ...dash,
    contasPagar: {
      quantidade: dash.data?.contasVencidas || 0,
      valor: dash.data?.despesasPendentes || 0,
    },
    contasReceber: {
      quantidade: 0,
      valor: dash.data?.receitasPendentes || 0,
    },
  };
}

// ============================================================================
// Fluxo de Caixa
// ============================================================================

export function useFluxoCaixa(meses: number = 6) {
  const [data, setData] = useState<FluxoCaixaChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hoje = new Date();
        // Inicio: 6 meses atras
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - meses, 1);
        // Fim: 6 meses no futuro
        const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 6, 0);

        // Log de debug para diagnóstico
        if (process.env.NODE_ENV === 'development') {
          console.log('[Dashboard Financeiro] Buscando fluxo de caixa:', {
            dataInicio: inicio.toISOString(),
            dataFim: fim.toISOString(),
            meses,
          });
        }

        const result = await actionObterFluxoCaixaUnificado({
          dataInicio: inicio.toISOString(),
          dataFim: fim.toISOString(),
          incluirProjetado: true,
        });

        if (result.success && result.data) {
          const fluxoData = result.data as unknown as FluxoCaixaUnificado;
          const dadosGrafico = transformToChartData(fluxoData);

          // Log de debug para diagnóstico
          if (process.env.NODE_ENV === 'development') {
            console.log('[Dashboard Financeiro] Fluxo de caixa transformado:', {
              periodosOriginais: fluxoData.periodos?.length || 0,
              dadosGrafico: dadosGrafico.length,
            });
          }

          setData(dadosGrafico);
        } else {
          const errorMsg = !result.success ? result.error : 'Erro ao buscar fluxo de caixa';
          console.error('[Dashboard Financeiro] Erro ao buscar fluxo de caixa:', errorMsg);
          setError(new Error(errorMsg));
        }
      } catch (err) {
        console.error('[Dashboard Financeiro] Erro inesperado no fluxo de caixa:', err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [meses]);

  return {
    data,
    isLoading: loading,
    error,
    isValidating: loading,
    mutate: () => {},
  };
}

function transformToChartData(fluxoUnificado: FluxoCaixaUnificado): FluxoCaixaChartData[] {
  // Tratamento para dados vazios ou nulos
  if (!fluxoUnificado) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Dashboard Financeiro] transformToChartData: dados vazios');
    }
    return [];
  }

  // Adaptar dados do fluxo unificado para formato de gráfico
  const resultado: FluxoCaixaChartData[] = [];

  // Se tiver dados por período
  if (fluxoUnificado.periodos && Array.isArray(fluxoUnificado.periodos) && fluxoUnificado.periodos.length > 0) {
    return fluxoUnificado.periodos.map((p) => ({
      mes: p.periodo || p.mes || '',
      receitas: p.entradas || p.receitas || 0,
      despesas: p.saidas || p.despesas || 0,
      saldo: p.saldo || 0,
    }));
  }

  // Fallback para formato simples
  if (fluxoUnificado.realizado || fluxoUnificado.projetado) {
    return [
      {
        mes: 'Realizado',
        receitas: fluxoUnificado.realizado?.receitas || fluxoUnificado.realizado?.entradas || 0,
        despesas: fluxoUnificado.realizado?.despesas || fluxoUnificado.realizado?.saidas || 0,
      },
      {
        mes: 'Projetado',
        receitas: fluxoUnificado.projetado?.receitas || fluxoUnificado.projetado?.entradas || 0,
        despesas: fluxoUnificado.projetado?.despesas || fluxoUnificado.projetado?.saidas || 0,
      },
    ];
  }

  // Log de debug se não houver dados
  if (process.env.NODE_ENV === 'development') {
    console.log('[Dashboard Financeiro] transformToChartData: nenhum dado de período encontrado');
  }

  return resultado;
}

// ============================================================================
// Despesas por Categoria
// ============================================================================

export function useDespesasPorCategoria() {
  const [data, setData] = useState<CategoriaValor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Log de debug para diagnóstico
        if (process.env.NODE_ENV === 'development') {
          console.log('[Dashboard Financeiro] Buscando despesas por categoria...');
        }

        const result = await actionObterTopCategorias('despesa', 5);

        if (result.success && result.data) {
          const categorias = result.data.categorias || [];

          // Log de debug para diagnóstico
          if (process.env.NODE_ENV === 'development') {
            console.log('[Dashboard Financeiro] Despesas por categoria:', {
              total: categorias.length,
              categorias: categorias.map(c => c.categoria),
            });
          }

          setData(categorias.map((c) => ({
            categoria: c.categoria,
            valor: c.valor,
          })));
        } else {
          console.error('[Dashboard Financeiro] Erro ao buscar categorias:', result.error);
          setError(new Error(result.error || 'Erro ao buscar categorias'));
        }
      } catch (err) {
        console.error('[Dashboard Financeiro] Erro inesperado nas categorias:', err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    despesasPorCategoria: data,
    isLoading: loading,
    error,
  };
}

// ============================================================================
// Orçamento Atual
// ============================================================================

export function useOrcamentoAtual() {
  const dash = useDashboardFinanceiro();

  return {
    ...dash,
    orcamentoAtual: null, // TODO: Implementar quando houver módulo de orçamentos
  };
}

// ============================================================================
// Alertas Financeiros
// ============================================================================

export function useAlertasFinanceiros() {
  const dash = useDashboardFinanceiro();

  // Gerar alertas baseado nos dados
  const alertas: { tipo: string; mensagem: string }[] = [];

  if (dash.data) {
    if (dash.data.contasVencidas > 0) {
      alertas.push({
        tipo: 'danger',
        mensagem: `${dash.data.contasVencidas} conta(s) vencida(s) no valor de ${formatarMoeda(dash.data.valorVencido)}`,
      });
    }

    if (dash.data.despesasMes > dash.data.receitasMes) {
      alertas.push({
        tipo: 'warning',
        mensagem: 'Despesas do mês superam as receitas',
      });
    }
  }

  return {
    ...dash,
    alertas,
  };
}

// Helper para formatar moeda
function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
