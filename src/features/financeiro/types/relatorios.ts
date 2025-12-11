/**
 * Tipos para relatórios financeiros
 */

export interface RelatorioComparativo {
  orcamentos: Array<{
    orcamentoId: number;
    orcamentoNome: string;
    ano: number;
    periodo: string;
    totalOrcado: number;
    totalRealizado: number;
    variacao: number;
    percentualRealizacao: number;
  }>;
  resumoGeral: {
    totalOrcadoGeral: number;
    totalRealizadoGeral: number;
    variacaoMediaPercentual: number;
    melhorPerformance: {
      orcamentoId: number;
      orcamentoNome: string;
      percentualRealizacao: number;
    } | null;
    piorPerformance: {
      orcamentoId: number;
      orcamentoNome: string;
      percentualRealizacao: number;
    } | null;
  };
  geradoEm: string;
}

export interface RelatorioCompleto {
  orcamento: unknown;
  analise: unknown;
  resumo?: unknown;
  alertas?: Array<{ mensagem: string; severidade: string }>;
  evolucao?: unknown[];
  projecao?: unknown[] | null;
  geradoEm: string;
}

export interface RelatorioExecutivo {
  resumo: unknown;
  principaisIndicadores: unknown;
  alertas: Array<{ mensagem: string; severidade: string }>;
  geradoEm: string;
}

export interface AnaliseParaUI {
  resumo: unknown;
  principaisIndicadores: unknown;
  alertas: Array<{ mensagem: string; severidade: string }>;
}

