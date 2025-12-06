/**
 * Serviço de Listagem de Obrigações Financeiras
 * Fornece visão consolidada de todas obrigações do sistema
 */

import {
  listarObrigacoesConsolidadas,
  buscarObrigacoesVencidas,
  buscarObrigacoesVencendoEm,
  buscarObrigacoesPorCliente,
  buscarObrigacoesPorProcesso,
  calcularTotaisObrigacoes,
} from '../persistence/obrigacoes-persistence.service';
import type {
  ListarObrigacoesParams,
  ListarObrigacoesResponse,
  ResumoObrigacoes,
  ResumoObrigacoesPorTipo,
  TipoObrigacao,
  StatusObrigacao,
  ObrigacaoComDetalhes,
} from '@/backend/types/financeiro/obrigacoes.types';

// ============================================================================
// Serviço Principal de Listagem
// ============================================================================

/**
 * Lista obrigações consolidadas com paginação e resumo
 */
export const listarObrigacoes = async (
  params: ListarObrigacoesParams
): Promise<ListarObrigacoesResponse> => {
  const {
    pagina = 1,
    limite = 50,
  } = params;

  // Buscar todas as obrigações (já filtradas e ordenadas)
  const todasObrigacoes = await listarObrigacoesConsolidadas(params);

  // Aplicar paginação
  const inicio = (pagina - 1) * limite;
  const fim = inicio + limite;
  const items = todasObrigacoes.slice(inicio, fim);

  // Calcular paginação
  const total = todasObrigacoes.length;
  const totalPaginas = Math.ceil(total / limite);

  // Calcular resumo
  const resumo = calcularResumoObrigacoes(todasObrigacoes, params);

  return {
    items,
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas,
    },
    resumo,
  };
};

/**
 * Obtém apenas o resumo de obrigações (sem listar items)
 * Útil para cards de dashboard
 */
export const obterResumoObrigacoes = async (
  filtros?: Partial<ListarObrigacoesParams>
): Promise<ResumoObrigacoes> => {
  // Buscar obrigações com filtros
  const obrigacoes = await listarObrigacoesConsolidadas(filtros || {});

  return calcularResumoObrigacoes(obrigacoes, filtros);
};

/**
 * Calcula o resumo a partir de uma lista de obrigações
 */
const calcularResumoObrigacoes = (
  obrigacoes: ObrigacaoComDetalhes[],
  filtros?: Partial<ListarObrigacoesParams>
): ResumoObrigacoes => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const em7Dias = new Date(hoje);
  em7Dias.setDate(em7Dias.getDate() + 7);

  // Inicializar contadores
  const resumo: ResumoObrigacoes = {
    totalObrigacoes: obrigacoes.length,
    valorTotal: 0,
    pendentes: { quantidade: 0, valor: 0 },
    vencidas: { quantidade: 0, valor: 0 },
    efetivadas: { quantidade: 0, valor: 0 },
    vencendoHoje: { quantidade: 0, valor: 0 },
    vencendoEm7Dias: { quantidade: 0, valor: 0 },
    porTipo: [],
    sincronizacao: {
      sincronizados: 0,
      pendentes: 0,
      inconsistentes: 0,
    },
    dataInicio: filtros?.dataVencimentoInicio,
    dataFim: filtros?.dataVencimentoFim,
  };

  // Contadores por tipo
  const porTipoMap: Record<TipoObrigacao, ResumoObrigacoesPorTipo> = {
    acordo_recebimento: {
      tipo: 'acordo_recebimento',
      totalPendente: 0,
      totalVencido: 0,
      totalEfetivado: 0,
      valorTotalPendente: 0,
      valorTotalVencido: 0,
      valorTotalEfetivado: 0,
    },
    acordo_pagamento: {
      tipo: 'acordo_pagamento',
      totalPendente: 0,
      totalVencido: 0,
      totalEfetivado: 0,
      valorTotalPendente: 0,
      valorTotalVencido: 0,
      valorTotalEfetivado: 0,
    },
    conta_receber: {
      tipo: 'conta_receber',
      totalPendente: 0,
      totalVencido: 0,
      totalEfetivado: 0,
      valorTotalPendente: 0,
      valorTotalVencido: 0,
      valorTotalEfetivado: 0,
    },
    conta_pagar: {
      tipo: 'conta_pagar',
      totalPendente: 0,
      totalVencido: 0,
      totalEfetivado: 0,
      valorTotalPendente: 0,
      valorTotalVencido: 0,
      valorTotalEfetivado: 0,
    },
  };

  // Processar cada obrigação
  for (const obrigacao of obrigacoes) {
    resumo.valorTotal += obrigacao.valor;
    const tipoData = porTipoMap[obrigacao.tipo];

    // Por status
    switch (obrigacao.status) {
      case 'pendente':
        resumo.pendentes.quantidade++;
        resumo.pendentes.valor += obrigacao.valor;
        tipoData.totalPendente++;
        tipoData.valorTotalPendente += obrigacao.valor;
        break;
      case 'vencida':
        resumo.vencidas.quantidade++;
        resumo.vencidas.valor += obrigacao.valor;
        tipoData.totalVencido++;
        tipoData.valorTotalVencido += obrigacao.valor;
        break;
      case 'efetivada':
        resumo.efetivadas.quantidade++;
        resumo.efetivadas.valor += obrigacao.valor;
        tipoData.totalEfetivado++;
        tipoData.valorTotalEfetivado += obrigacao.valor;
        break;
    }

    // Vencendo hoje
    if (obrigacao.diasAteVencimento === 0 && obrigacao.status === 'pendente') {
      resumo.vencendoHoje.quantidade++;
      resumo.vencendoHoje.valor += obrigacao.valor;
    }

    // Vencendo em 7 dias
    if (
      obrigacao.diasAteVencimento !== null &&
      obrigacao.diasAteVencimento > 0 &&
      obrigacao.diasAteVencimento <= 7 &&
      obrigacao.status === 'pendente'
    ) {
      resumo.vencendoEm7Dias.quantidade++;
      resumo.vencendoEm7Dias.valor += obrigacao.valor;
    }

    // Status de sincronização
    switch (obrigacao.statusSincronizacao) {
      case 'sincronizado':
        resumo.sincronizacao.sincronizados++;
        break;
      case 'pendente':
        resumo.sincronizacao.pendentes++;
        break;
      case 'inconsistente':
        resumo.sincronizacao.inconsistentes++;
        break;
    }
  }

  // Converter mapa para array
  resumo.porTipo = Object.values(porTipoMap);

  return resumo;
};

// ============================================================================
// Serviços Especializados
// ============================================================================

/**
 * Lista obrigações de um cliente específico
 */
export const listarObrigacoesCliente = async (
  clienteId: number,
  params?: Partial<ListarObrigacoesParams>
): Promise<ListarObrigacoesResponse> => {
  const filtrosCompletos: ListarObrigacoesParams = {
    ...params,
    clienteId,
    pagina: params?.pagina || 1,
    limite: params?.limite || 50,
  };

  return listarObrigacoes(filtrosCompletos);
};

/**
 * Lista obrigações de um processo específico
 */
export const listarObrigacoesProcesso = async (
  processoId: number,
  params?: Partial<ListarObrigacoesParams>
): Promise<ListarObrigacoesResponse> => {
  const filtrosCompletos: ListarObrigacoesParams = {
    ...params,
    processoId,
    pagina: params?.pagina || 1,
    limite: params?.limite || 50,
  };

  return listarObrigacoes(filtrosCompletos);
};

/**
 * Lista obrigações vencidas
 */
export const listarObrigacoesVencidas = async (
  params?: Partial<ListarObrigacoesParams>
): Promise<ListarObrigacoesResponse> => {
  const filtrosCompletos: ListarObrigacoesParams = {
    ...params,
    apenasVencidas: true,
    pagina: params?.pagina || 1,
    limite: params?.limite || 50,
  };

  return listarObrigacoes(filtrosCompletos);
};

/**
 * Lista obrigações com inconsistências de sincronização
 */
export const listarObrigacoesInconsistentes = async (
  params?: Partial<ListarObrigacoesParams>
): Promise<ListarObrigacoesResponse> => {
  const filtrosCompletos: ListarObrigacoesParams = {
    ...params,
    apenasInconsistentes: true,
    pagina: params?.pagina || 1,
    limite: params?.limite || 50,
  };

  return listarObrigacoes(filtrosCompletos);
};

/**
 * Lista obrigações que vencem em breve (próximos N dias)
 */
export const listarObrigacoesVencendoEm = async (
  dias: number,
  params?: Partial<ListarObrigacoesParams>
): Promise<ListarObrigacoesResponse> => {
  const hoje = new Date();
  const dataLimite = new Date(hoje);
  dataLimite.setDate(dataLimite.getDate() + dias);

  const filtrosCompletos: ListarObrigacoesParams = {
    ...params,
    dataVencimentoInicio: hoje.toISOString().split('T')[0],
    dataVencimentoFim: dataLimite.toISOString().split('T')[0],
    status: ['pendente'] as StatusObrigacao[],
    pagina: params?.pagina || 1,
    limite: params?.limite || 50,
  };

  return listarObrigacoes(filtrosCompletos);
};

// ============================================================================
// Alertas e Notificações
// ============================================================================

/**
 * Obtém dados para alertas do dashboard
 */
export const obterAlertasObrigacoes = async (): Promise<{
  vencidas: { quantidade: number; valor: number; items: ObrigacaoComDetalhes[] };
  vencendoHoje: { quantidade: number; valor: number; items: ObrigacaoComDetalhes[] };
  vencendoEm7Dias: { quantidade: number; valor: number; items: ObrigacaoComDetalhes[] };
  inconsistentes: { quantidade: number; items: ObrigacaoComDetalhes[] };
}> => {
  const hoje = new Date();
  const hojeStr = hoje.toISOString().split('T')[0];

  const em7Dias = new Date(hoje);
  em7Dias.setDate(em7Dias.getDate() + 7);
  const em7DiasStr = em7Dias.toISOString().split('T')[0];

  // Buscar todas as obrigações pendentes
  const obrigacoes = await listarObrigacoesConsolidadas({
    status: ['pendente', 'vencida'] as StatusObrigacao[],
  });

  // Separar por categoria
  const vencidas: ObrigacaoComDetalhes[] = [];
  const vencendoHoje: ObrigacaoComDetalhes[] = [];
  const vencendoEm7Dias: ObrigacaoComDetalhes[] = [];
  const inconsistentes: ObrigacaoComDetalhes[] = [];

  for (const obrigacao of obrigacoes) {
    // Vencidas
    if (obrigacao.status === 'vencida') {
      vencidas.push(obrigacao);
    }

    // Vencendo hoje
    if (obrigacao.diasAteVencimento === 0 && obrigacao.status === 'pendente') {
      vencendoHoje.push(obrigacao);
    }

    // Vencendo em 7 dias
    if (
      obrigacao.diasAteVencimento !== null &&
      obrigacao.diasAteVencimento > 0 &&
      obrigacao.diasAteVencimento <= 7 &&
      obrigacao.status === 'pendente'
    ) {
      vencendoEm7Dias.push(obrigacao);
    }

    // Inconsistentes
    if (obrigacao.statusSincronizacao === 'inconsistente') {
      inconsistentes.push(obrigacao);
    }
  }

  // Calcular totais
  const calcularTotal = (items: ObrigacaoComDetalhes[]) =>
    items.reduce((acc, item) => acc + item.valor, 0);

  return {
    vencidas: {
      quantidade: vencidas.length,
      valor: calcularTotal(vencidas),
      items: vencidas.slice(0, 10), // Limitar a 10 items
    },
    vencendoHoje: {
      quantidade: vencendoHoje.length,
      valor: calcularTotal(vencendoHoje),
      items: vencendoHoje.slice(0, 10),
    },
    vencendoEm7Dias: {
      quantidade: vencendoEm7Dias.length,
      valor: calcularTotal(vencendoEm7Dias),
      items: vencendoEm7Dias.slice(0, 10),
    },
    inconsistentes: {
      quantidade: inconsistentes.length,
      items: inconsistentes.slice(0, 10),
    },
  };
};

// ============================================================================
// Estatísticas e Métricas
// ============================================================================

/**
 * Obtém estatísticas gerais de obrigações
 */
export const obterEstatisticasObrigacoes = async (): Promise<{
  totalGeral: number;
  valorTotalGeral: number;
  receitasPendentes: number;
  despesasPendentes: number;
  taxaSincronizacao: number; // Percentual de obrigações sincronizadas
  taxaAdimplencia: number; // Percentual de obrigações efetivadas no prazo
}> => {
  const obrigacoes = await listarObrigacoesConsolidadas({});

  const totalGeral = obrigacoes.length;
  let valorTotalGeral = 0;
  let receitasPendentes = 0;
  let despesasPendentes = 0;
  let sincronizados = 0;
  let efetivadas = 0;
  let total = 0;

  for (const obrigacao of obrigacoes) {
    valorTotalGeral += obrigacao.valor;

    // Receitas e despesas pendentes
    if (obrigacao.status === 'pendente' || obrigacao.status === 'vencida') {
      if (obrigacao.tipo === 'acordo_recebimento' || obrigacao.tipo === 'conta_receber') {
        receitasPendentes += obrigacao.valor;
      } else {
        despesasPendentes += obrigacao.valor;
      }
    }

    // Taxa de sincronização
    if (obrigacao.statusSincronizacao !== 'nao_aplicavel') {
      total++;
      if (obrigacao.statusSincronizacao === 'sincronizado') {
        sincronizados++;
      }
    }

    // Taxa de adimplência
    if (obrigacao.status === 'efetivada') {
      efetivadas++;
    }
  }

  const taxaSincronizacao = total > 0 ? (sincronizados / total) * 100 : 100;
  const taxaAdimplencia = totalGeral > 0 ? (efetivadas / totalGeral) * 100 : 0;

  return {
    totalGeral,
    valorTotalGeral,
    receitasPendentes,
    despesasPendentes,
    taxaSincronizacao,
    taxaAdimplencia,
  };
};
