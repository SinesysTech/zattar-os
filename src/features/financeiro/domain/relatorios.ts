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

export interface RelatorioCompleto {
  orcamento: any; // Using any to avoid circular dependencies or if type is generic. Ideally should be OrcamentoComDetalhes
  analise: any;
  resumo?: any;
  alertas?: Array<{ mensagem: string; severidade: string }>;
  evolucao?: any[];
  projecao?: any[] | null;
  geradoEm: string;
}

export interface RelatorioExecutivo {
  resumo: any;
  principaisIndicadores: any;
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
