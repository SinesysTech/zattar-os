import { getCached, setCached } from '@/backend/utils/redis/cache-utils';

export interface MetricaFinanceira {
  saldoAtual: number;
  contasPagarPendentes: { quantidade: number; valor: number };
  contasReceberPendentes: { quantidade: number; valor: number };
  vencimentosProximos: {
    vencidas: number;
    hoje: number;
    proximos7dias: number;
    proximos30dias: number;
  };
  fluxoCaixaMensal: Array<{ mes: string; receitas: number; despesas: number }>;
  despesasPorCategoria: Array<{ categoria: string; valor: number }>;
  receitasPorCategoria: Array<{ categoria: string; valor: number }>;
  obrigacoesResumo: { pendentes: number; vencidas: number; efetivadas: number };
  folhaPagamentoAtual: { mes: number; ano: number; valor: number; status: string } | null;
  orcamentoAtual: { nome: string; percentualRealizacao: number; status: string } | null;
  transacoesPendentes: number;
}

export const getMetricasFinanceiras = async (): Promise<MetricaFinanceira> => {
  const cacheKey = 'dashboard:financeiro:metricas';
  const cached = await getCached<MetricaFinanceira>(cacheKey);
  if (cached) {
    return cached;
  }

  // Placeholder simplificado; implementação detalhada deve consultar o banco.
  const metricas: MetricaFinanceira = {
    saldoAtual: 0,
    contasPagarPendentes: { quantidade: 0, valor: 0 },
    contasReceberPendentes: { quantidade: 0, valor: 0 },
    vencimentosProximos: { vencidas: 0, hoje: 0, proximos7dias: 0, proximos30dias: 0 },
    fluxoCaixaMensal: [],
    despesasPorCategoria: [],
    receitasPorCategoria: [],
    obrigacoesResumo: { pendentes: 0, vencidas: 0, efetivadas: 0 },
    folhaPagamentoAtual: null,
    orcamentoAtual: null,
    transacoesPendentes: 0,
  };

  await setCached(cacheKey, metricas, 300);
  return metricas;
};

export const getFluxoCaixaProjetado = async (meses: number): Promise<
  Array<{ mes: string; receitas: number; despesas: number }>
> => {
  const cacheKey = `dashboard:financeiro:fluxo:${meses}`;
  const cached = await getCached<Array<{ mes: string; receitas: number; despesas: number }>>(cacheKey);
  if (cached) {
    return cached;
  }

  const agora = new Date();
  const resultado: Array<{ mes: string; receitas: number; despesas: number }> = [];
  for (let i = 0; i < meses; i++) {
    const data = new Date(agora.getFullYear(), agora.getMonth() + i, 1);
    resultado.push({
      mes: `${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`,
      receitas: 0,
      despesas: 0,
    });
  }

  await setCached(cacheKey, resultado, 300);
  return resultado;
};

export const getAlertasFinanceiros = async (): Promise<
  Array<{ tipo: string; mensagem: string; nivel: 'info' | 'warning' | 'danger' }>
> => {
  const cacheKey = 'dashboard:financeiro:alertas';
  const cached = await getCached<Array<{ tipo: string; mensagem: string; nivel: 'info' | 'warning' | 'danger' }>>(
    cacheKey
  );
  if (cached) {
    return cached;
  }

  const alertas: Array<{ tipo: string; mensagem: string; nivel: 'info' | 'warning' | 'danger' }> = [];
  await setCached(cacheKey, alertas, 300);
  return alertas;
};
