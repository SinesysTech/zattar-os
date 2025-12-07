/**
 * Serviço de Relatórios de Orçamentos
 * Gerencia a geração de relatórios e análises orçamentárias
 */

import {
  buscarOrcamentoComDetalhes,
} from '../persistence/orcamento-persistence.service';
import {
  buscarAnaliseOrcamentaria,
  buscarResumoOrcamentario,
  buscarAlertasDesvios,
  buscarEvolucaoMensal,
  buscarProjecaoOrcamentaria,
  buscarComparativoAnual,
} from '../persistence/analise-orcamentaria-persistence.service';
import type {
  OrcamentoComDetalhes,
  AnaliseOrcamentaria,
  ResumoOrcamentario,
  AlertaOrcamentario,
  EvolucaoMensal,
  ProjecaoOrcamentaria,
  ComparativoOrcamento,
  AnaliseOrcamentariaItem,
  AlertaDesvio,
  ProjecaoItem,
  ItemAnalise,
} from '@/backend/types/financeiro/orcamento.types';

// ============================================================================
// Tipos de Mapeamento UI
// ============================================================================

/**
 * Estrutura de análise pronta para consumo pela UI
 */
export interface AnaliseParaUI {
  itens: AnaliseOrcamentariaItem[];
  resumo: ResumoOrcamentario | null;
  alertas: AlertaDesvio[];
  evolucao: EvolucaoMensal[];
  projecao: ProjecaoItem[];
}

// ============================================================================
// Funções de Mapeamento
// ============================================================================

/**
 * Mapeia ItemAnalise do domínio para AnaliseOrcamentariaItem da UI
 */
function mapItemAnaliseToUI(item: ItemAnalise, index: number): AnaliseOrcamentariaItem {
  // Mapear status do domínio para status da UI
  let uiStatus: 'dentro_orcamento' | 'atencao' | 'estourado';
  switch (item.status) {
    case 'dentro':
      uiStatus = 'dentro_orcamento';
      break;
    case 'atencao':
      uiStatus = 'atencao';
      break;
    case 'critico':
      uiStatus = 'estourado';
      break;
    default:
      uiStatus = 'dentro_orcamento';
  }

  return {
    id: item.contaContabilId * 1000 + index, // ID sintético baseado na conta + índice
    contaContabil: {
      id: item.contaContabilId,
      codigo: item.contaContabilCodigo,
      nome: item.contaContabilNome,
    },
    centroCusto: item.centroCustoId
      ? {
          id: item.centroCustoId,
          codigo: item.centroCustoCodigo || '',
          nome: item.centroCustoNome || '',
        }
      : null,
    mes: item.mes,
    valorOrcado: item.valorOrcado,
    valorRealizado: item.valorRealizado,
    variacao: item.variacao,
    variacaoPercentual: item.variacaoPercentual,
    percentualRealizacao: item.percentualRealizacao,
    status: uiStatus,
  };
}

/**
 * Mapeia AlertaOrcamentario do domínio para AlertaDesvio da UI
 */
function mapAlertaToUI(alerta: AlertaOrcamentario): AlertaDesvio {
  // Mapear severidade do domínio para severidade da UI
  let uiSeveridade: 'baixa' | 'media' | 'alta' | 'critica';
  switch (alerta.severidade) {
    case 'info':
      uiSeveridade = 'baixa';
      break;
    case 'warning':
      uiSeveridade = 'media';
      break;
    case 'error':
      uiSeveridade = 'critica';
      break;
    default:
      uiSeveridade = 'media';
  }

  return {
    contaContabil: alerta.contaContabilCodigo
      ? `${alerta.contaContabilCodigo} - ${alerta.contaContabilNome || ''}`
      : 'Geral',
    centroCusto: undefined, // Alertas do domínio não têm nome do centro de custo
    severidade: uiSeveridade,
    mensagem: alerta.mensagem,
    valorOrcado: alerta.valorOrcado || 0,
    valorRealizado: alerta.valorRealizado || 0,
    variacao: alerta.variacaoPercentual || 0,
  };
}

/**
 * Gera itens de projeção a partir da análise (projeção por conta contábil)
 */
function gerarProjecaoItens(analise: AnaliseOrcamentaria): ProjecaoItem[] {
  if (!analise.projecao || analise.periodo.mesesDecorridos === 0) {
    return [];
  }

  return analise.itensPorConta.map((item) => {
    // Calcular projeção baseada na média mensal realizada
    const mediaMensal = item.valorRealizado / analise.periodo.mesesDecorridos;
    const projecaoFinal = mediaMensal * analise.periodo.mesesTotal;
    const variacaoProjetada = item.valorOrcado === 0
      ? 0
      : ((projecaoFinal - item.valorOrcado) / item.valorOrcado) * 100;

    // Determinar tendência
    let tendencia: 'alta' | 'estavel' | 'baixa';
    if (variacaoProjetada > 5) {
      tendencia = 'alta';
    } else if (variacaoProjetada < -5) {
      tendencia = 'baixa';
    } else {
      tendencia = 'estavel';
    }

    return {
      contaContabil: `${item.contaContabilCodigo} - ${item.contaContabilNome}`,
      centroCusto: item.centroCustoNome || undefined,
      realizadoAtual: item.valorRealizado,
      projecaoFinal,
      variacaoProjetada,
      tendencia,
    };
  });
}

/**
 * Mapeia AnaliseOrcamentaria completa para estrutura pronta para UI
 */
export function mapAnaliseToUI(analise: AnaliseOrcamentaria | null): AnaliseParaUI {
  if (!analise) {
    return {
      itens: [],
      resumo: null,
      alertas: [],
      evolucao: [],
      projecao: [],
    };
  }

  return {
    itens: analise.itensPorConta.map((item, index) => mapItemAnaliseToUI(item, index)),
    resumo: analise.resumo,
    alertas: analise.alertas.map(mapAlertaToUI),
    evolucao: analise.evolucaoMensal,
    projecao: gerarProjecaoItens(analise),
  };
}

// ============================================================================
// Tipos de Relatórios
// ============================================================================

export interface RelatorioCompleto {
  orcamento: OrcamentoComDetalhes;
  analise: AnaliseOrcamentaria | null;
  resumo: ResumoOrcamentario | null;
  alertas: AlertaOrcamentario[];
  evolucao: EvolucaoMensal[];
  projecao: ProjecaoOrcamentaria | null;
  geradoEm: string;
}

export interface RelatorioComparativo {
  orcamentos: ComparativoOrcamento[];
  resumoGeral: {
    totalOrcadoGeral: number;
    totalRealizadoGeral: number;
    variacaoMediaPercentual: number;
    melhorPerformance: ComparativoOrcamento | null;
    piorPerformance: ComparativoOrcamento | null;
  };
  geradoEm: string;
}

export interface RelatorioExecutivo {
  periodo: string;
  situacaoGeral: 'positiva' | 'neutra' | 'negativa';
  resumoFinanceiro: {
    totalOrcado: number;
    totalRealizado: number;
    economia: number;
    percentualRealizacao: number;
  };
  principaisDesvios: Array<{
    conta: string;
    valorOrcado: number;
    valorRealizado: number;
    variacao: number;
  }>;
  alertasCriticos: AlertaOrcamentario[];
  recomendacoes: string[];
  geradoEm: string;
}

// ============================================================================
// Funções de Geração de Relatórios
// ============================================================================

/**
 * Gera relatório completo de um orçamento
 */
export async function gerarRelatorioCompleto(
  orcamentoId: number
): Promise<RelatorioCompleto | null> {
  console.log('📊 Gerando relatório completo...', { orcamentoId });

  try {
    // Buscar dados do orçamento
    const orcamento = await buscarOrcamentoComDetalhes(orcamentoId);
    if (!orcamento) {
      console.warn('Orçamento não encontrado:', orcamentoId);
      return null;
    }

    // Buscar dados de análise em paralelo
    const [analise, resumo, alertas, evolucao, projecao] = await Promise.all([
      buscarAnaliseOrcamentaria({ orcamentoId }),
      buscarResumoOrcamentario(orcamentoId),
      buscarAlertasDesvios(orcamentoId),
      buscarEvolucaoMensal(orcamentoId),
      buscarProjecaoOrcamentaria(orcamentoId),
    ]);

    console.log('✅ Relatório completo gerado com sucesso');

    return {
      orcamento,
      analise,
      resumo,
      alertas,
      evolucao,
      projecao,
      geradoEm: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Erro ao gerar relatório completo:', error);
    throw error;
  }
}

/**
 * Gera relatório comparativo entre orçamentos
 */
export async function gerarRelatorioComparativo(
  anos: number[]
): Promise<RelatorioComparativo> {
  console.log('📊 Gerando relatório comparativo...', { anos });

  try {
    const orcamentos = await buscarComparativoAnual(anos);

    // Calcular resumo geral
    const totalOrcadoGeral = orcamentos.reduce((sum, o) => sum + o.totalOrcado, 0);
    const totalRealizadoGeral = orcamentos.reduce((sum, o) => sum + o.totalRealizado, 0);

    const variacaoMediaPercentual = orcamentos.length > 0
      ? orcamentos.reduce((sum, o) => sum + (o.variacao / o.totalOrcado * 100), 0) / orcamentos.length
      : 0;

    // Encontrar melhor e pior performance
    const ordenadosPorPerformance = [...orcamentos].sort(
      (a, b) => a.percentualRealizacao - b.percentualRealizacao
    );

    const melhorPerformance = ordenadosPorPerformance.length > 0
      ? ordenadosPorPerformance.find(o => o.totalRealizado <= o.totalOrcado) || ordenadosPorPerformance[0]
      : null;

    const piorPerformance = ordenadosPorPerformance.length > 0
      ? ordenadosPorPerformance[ordenadosPorPerformance.length - 1]
      : null;

    console.log('✅ Relatório comparativo gerado com sucesso');

    return {
      orcamentos,
      resumoGeral: {
        totalOrcadoGeral,
        totalRealizadoGeral,
        variacaoMediaPercentual,
        melhorPerformance,
        piorPerformance,
      },
      geradoEm: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Erro ao gerar relatório comparativo:', error);
    throw error;
  }
}

/**
 * Gera relatório executivo com resumo e recomendações
 */
export async function gerarRelatorioExecutivo(
  orcamentoId: number
): Promise<RelatorioExecutivo | null> {
  console.log('📊 Gerando relatório executivo...', { orcamentoId });

  try {
    const orcamento = await buscarOrcamentoComDetalhes(orcamentoId);
    if (!orcamento) {
      return null;
    }

    const [resumo, alertas, analise] = await Promise.all([
      buscarResumoOrcamentario(orcamentoId),
      buscarAlertasDesvios(orcamentoId),
      buscarAnaliseOrcamentaria({ orcamentoId }),
    ]);

    if (!resumo) {
      return null;
    }

    // Determinar situação geral
    let situacaoGeral: 'positiva' | 'neutra' | 'negativa';
    if (resumo.variacaoPercentual <= -5) {
      situacaoGeral = 'positiva'; // Economia
    } else if (resumo.variacaoPercentual <= 10) {
      situacaoGeral = 'neutra'; // Dentro do esperado
    } else {
      situacaoGeral = 'negativa'; // Estouro
    }

    // Principais desvios
    const principaisDesvios = analise?.itensPorConta
      ?.filter(item => Math.abs(item.variacaoPercentual) > 10)
      .sort((a, b) => Math.abs(b.variacaoPercentual) - Math.abs(a.variacaoPercentual))
      .slice(0, 5)
      .map(item => ({
        conta: `${item.contaContabilCodigo} - ${item.contaContabilNome}`,
        valorOrcado: item.valorOrcado,
        valorRealizado: item.valorRealizado,
        variacao: item.variacaoPercentual,
      })) || [];

    // Alertas críticos
    const alertasCriticos = alertas.filter(a => a.severidade === 'error');

    // Gerar recomendações baseadas na análise
    const recomendacoes: string[] = [];

    if (resumo.variacaoPercentual > 20) {
      recomendacoes.push('Revisar urgentemente os itens com maior desvio');
    }
    if (resumo.percentualRealizacao < 50 && orcamento.status === 'em_execucao') {
      recomendacoes.push('Acelerar a execução do orçamento para atingir as metas');
    }
    if (alertasCriticos.length > 0) {
      recomendacoes.push(`Tratar ${alertasCriticos.length} alerta(s) crítico(s) identificado(s)`);
    }
    if (principaisDesvios.some(d => d.variacao > 30)) {
      recomendacoes.push('Realizar análise detalhada das contas com desvios superiores a 30%');
    }
    if (situacaoGeral === 'positiva') {
      recomendacoes.push('Manter práticas atuais de controle de custos');
    }

    console.log('✅ Relatório executivo gerado com sucesso');

    return {
      periodo: `${orcamento.ano} - ${orcamento.periodo}`,
      situacaoGeral,
      resumoFinanceiro: {
        totalOrcado: resumo.totalOrcado,
        totalRealizado: resumo.totalRealizado,
        economia: resumo.totalOrcado - resumo.totalRealizado,
        percentualRealizacao: resumo.percentualRealizacao,
      },
      principaisDesvios,
      alertasCriticos,
      recomendacoes,
      geradoEm: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Erro ao gerar relatório executivo:', error);
    throw error;
  }
}

/**
 * Gera dados para exportação em formato tabular
 */
export async function gerarDadosExportacao(
  orcamentoId: number
): Promise<{
  cabecalho: string[];
  linhas: (string | number)[][];
} | null> {
  try {
    const orcamento = await buscarOrcamentoComDetalhes(orcamentoId);
    if (!orcamento) {
      return null;
    }

    const analise = await buscarAnaliseOrcamentaria({ orcamentoId });
    if (!analise) {
      // Se não há análise, exportar apenas itens básicos
      const cabecalho = ['Conta Contábil', 'Centro de Custo', 'Mês', 'Valor Orçado', 'Observações'];
      const linhas = orcamento.itens.map(item => [
        item.contaContabil ? `${item.contaContabil.codigo} - ${item.contaContabil.nome}` : '',
        item.centroCusto?.nome || '-',
        item.mes?.toString() || 'Todos',
        item.valorOrcado,
        item.observacoes || '',
      ]);
      return { cabecalho, linhas };
    }

    // Exportar com dados de análise
    const cabecalho = [
      'Conta Contábil',
      'Tipo',
      'Centro de Custo',
      'Mês',
      'Valor Orçado',
      'Valor Realizado',
      'Variação (R$)',
      'Variação (%)',
      'Status',
    ];

    const linhas = analise.itensPorConta.map(item => [
      `${item.contaContabilCodigo} - ${item.contaContabilNome}`,
      item.tipoConta,
      item.centroCustoNome || '-',
      item.mes?.toString() || 'Todos',
      item.valorOrcado,
      item.valorRealizado,
      item.variacao,
      item.variacaoPercentual,
      item.status,
    ]);

    return { cabecalho, linhas };
  } catch (error) {
    console.error('❌ Erro ao gerar dados de exportação:', error);
    throw error;
  }
}

/**
 * Gera resumo para dashboard
 */
export async function gerarResumoDashboard(
  orcamentoId: number
): Promise<{
  status: string;
  valorTotal: number;
  valorRealizado: number;
  percentualRealizacao: number;
  alertasAtivos: number;
  tendencia: 'positiva' | 'neutra' | 'negativa';
} | null> {
  try {
    const orcamento = await buscarOrcamentoPorId(orcamentoId);
    if (!orcamento) {
      return null;
    }

    const [resumo, alertas, projecao] = await Promise.all([
      buscarResumoOrcamentario(orcamentoId),
      buscarAlertasDesvios(orcamentoId),
      buscarProjecaoOrcamentaria(orcamentoId),
    ]);

    return {
      status: orcamento.status,
      valorTotal: resumo?.totalOrcado || 0,
      valorRealizado: resumo?.totalRealizado || 0,
      percentualRealizacao: resumo?.percentualRealizacao || 0,
      alertasAtivos: alertas.length,
      tendencia: projecao?.tendencia || 'neutra',
    };
  } catch (error) {
    console.error('❌ Erro ao gerar resumo dashboard:', error);
    return null;
  }
}

// Helper function to import buscarOrcamentoPorId
import { buscarOrcamentoPorId } from '../persistence/orcamento-persistence.service';
