/**
 * Tipos para relatórios financeiros (Migrado de types/relatorios.ts)
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
  periodo?: string; // Add optional property if referenced
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

import type {
  Orcamento,
  OrcamentoComDetalhes,
  AnaliseOrcamentaria,
  ResumoOrcamentario,
  EvolucaoMensal,
  ProjecaoItem,
} from './orcamentos';

export interface RelatorioCompleto {
  orcamento: OrcamentoComDetalhes | Orcamento;
  analise: AnaliseOrcamentaria;
  resumo?: ResumoOrcamentario;
  alertas?: Array<{ mensagem: string; severidade: string }>;
  evolucao?: EvolucaoMensal[];
  projecao?: ProjecaoItem[] | null;
  geradoEm: string;
}

export interface RelatorioExecutivo {
  resumo: ResumoOrcamentario;
  principaisIndicadores: {
    totalOrcado: number;
    totalRealizado: number;
    percentualExecutado: number;
    saldo: number;
  };
  alertas: Array<{ mensagem: string; severidade: string }>;
  geradoEm: string;
}

export interface AnaliseParaUI {
  resumo: any;
  principaisIndicadores: any;
  alertas: Array<{ mensagem: string; severidade: string }>;
  itensPorConta?: Array<{
    contaContabilNome: string;
    contaContabilCodigo?: string;
    valorOrcado: number;
    valorRealizado: number;
    variacao: number;
    variacaoPercentual: number;
    status: string;
    centroCustoNome?: string;
    tipoConta?: string;
    mes?: number;
  }>;
  itens?: Array<{
        contaContabil?: { nome: string; codigo: string };
        valorOrcado: number;
        valorRealizado: number;
        variacao: number;
        variacaoPercentual: number;
        status: string;
    }>;
}
