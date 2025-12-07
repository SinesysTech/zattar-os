/**
 * Serviço de persistência para Análise Orçamentária
 * Consultas na view materializada v_orcamento_vs_realizado
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import {
  getCached,
  setCached,
  deletePattern,
  generateCacheKey,
} from '@/backend/utils/redis/cache-utils';
import type {
  AnaliseOrcamentaria,
  ResumoOrcamentario,
  ItemAnalise,
  AlertaOrcamentario,
  ProjecaoOrcamentaria,
  EvolucaoMensal,
  ComparativoOrcamento,
  BuscarAnaliseParams,
  StatusItemAnalise,
  SeveridadeAlerta,
  TendenciaProjecao,
} from '@/backend/types/financeiro/orcamento.types';
import {
  calcularVariacao,
  calcularProjecao,
  determinarTendencia,
  calcularMesesEntreDatas,
  calcularMesesDecorridos,
  getNomeMes,
} from '@/backend/types/financeiro/orcamento.types';
import { buscarOrcamentoPorId } from './orcamento-persistence.service';

// ============================================================================
// Constantes de Cache
// ============================================================================

const CACHE_PREFIX = 'analise_orcamentaria';
const CACHE_TTL = 300; // 5 minutos (mais curto pois dados mudam frequentemente)

// ============================================================================
// Tipos internos (mapeamento da view)
// ============================================================================

interface ViewOrcamentoVsRealizadoRecord {
  orcamento_id: number;
  orcamento_nome: string;
  ano: number;
  periodo: string;
  orcamento_status: string;
  data_inicio: string;
  data_fim: string;
  item_id: number;
  conta_contabil_id: number;
  conta_codigo: string;
  conta_nome: string;
  tipo_conta: string;
  centro_custo_id: number | null;
  centro_codigo: string | null;
  centro_nome: string | null;
  mes: number | null;
  valor_orcado: number;
  valor_realizado: number;
  variacao: number;
  percentual_realizado: number;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Determina o status do item baseado na variação percentual
 */
const determinarStatusItem = (variacaoPercentual: number): StatusItemAnalise => {
  const percentualAbsoluto = Math.abs(variacaoPercentual);
  if (percentualAbsoluto <= 10) return 'dentro';
  if (percentualAbsoluto <= 20) return 'atencao';
  return 'critico';
};

/**
 * Mapeia registro da view para ItemAnalise
 */
const mapearItemAnalise = (registro: ViewOrcamentoVsRealizadoRecord): ItemAnalise => {
  const valorOrcado = Number(registro.valor_orcado);
  const valorRealizado = Number(registro.valor_realizado);
  const variacao = valorOrcado - valorRealizado;
  const variacaoPercentual = valorOrcado === 0 ? 0 : ((valorRealizado - valorOrcado) / valorOrcado) * 100;
  const percentualRealizacao = valorOrcado === 0 ? 0 : (valorRealizado / valorOrcado) * 100;

  return {
    contaContabilId: registro.conta_contabil_id,
    contaContabilCodigo: registro.conta_codigo,
    contaContabilNome: registro.conta_nome,
    tipoConta: registro.tipo_conta,
    centroCustoId: registro.centro_custo_id,
    centroCustoCodigo: registro.centro_codigo,
    centroCustoNome: registro.centro_nome,
    mes: registro.mes,
    valorOrcado,
    valorRealizado,
    variacao,
    variacaoPercentual,
    percentualRealizacao,
    status: determinarStatusItem(variacaoPercentual),
  };
};

// ============================================================================
// Operações de Leitura
// ============================================================================

/**
 * Buscar análise orçamentária completa
 */
export const buscarAnaliseOrcamentaria = async (
  params: BuscarAnaliseParams
): Promise<AnaliseOrcamentaria | null> => {
  const cacheKey = generateCacheKey(`${CACHE_PREFIX}:${params.orcamentoId}`, params as unknown as Record<string, unknown>);
  const cached = await getCached<AnaliseOrcamentaria>(cacheKey);
  if (cached) {
    console.debug(`Cache hit for buscarAnaliseOrcamentaria: ${cacheKey}`);
    return cached;
  }
  console.debug(`Cache miss for buscarAnaliseOrcamentaria: ${cacheKey}`);

  const supabase = createServiceClient();

  // Buscar dados do orçamento
  const orcamento = await buscarOrcamentoPorId(params.orcamentoId);
  if (!orcamento) {
    return null;
  }

  // Buscar dados da view
  let query = supabase
    .from('v_orcamento_vs_realizado')
    .select('*')
    .eq('orcamento_id', params.orcamentoId);

  if (params.mes) {
    query = query.eq('mes', params.mes);
  }
  if (params.contaContabilId) {
    query = query.eq('conta_contabil_id', params.contaContabilId);
  }
  if (params.centroCustoId) {
    query = query.eq('centro_custo_id', params.centroCustoId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar análise orçamentária: ${error.message}`);
  }

  const itens = (data || []).map(mapearItemAnalise);

  // Calcular resumo
  const totalOrcado = itens.reduce((acc, item) => acc + item.valorOrcado, 0);
  const totalRealizado = itens.reduce((acc, item) => acc + item.valorRealizado, 0);
  const variacao = totalOrcado - totalRealizado;
  const variacaoPercentual = totalOrcado === 0 ? 0 : ((totalRealizado - totalOrcado) / totalOrcado) * 100;
  const percentualRealizacao = totalOrcado === 0 ? 0 : (totalRealizado / totalOrcado) * 100;

  const resumo: ResumoOrcamentario = {
    totalOrcado,
    totalRealizado,
    variacao,
    variacaoPercentual,
    percentualRealizacao,
  };

  // Agrupar por conta contábil
  const itensPorContaMap = new Map<number, ItemAnalise>();
  for (const item of itens) {
    const key = item.contaContabilId;
    const existente = itensPorContaMap.get(key);
    if (existente) {
      existente.valorOrcado += item.valorOrcado;
      existente.valorRealizado += item.valorRealizado;
      existente.variacao = existente.valorOrcado - existente.valorRealizado;
      existente.variacaoPercentual =
        existente.valorOrcado === 0
          ? 0
          : ((existente.valorRealizado - existente.valorOrcado) / existente.valorOrcado) * 100;
      existente.percentualRealizacao =
        existente.valorOrcado === 0
          ? 0
          : (existente.valorRealizado / existente.valorOrcado) * 100;
      existente.status = determinarStatusItem(existente.variacaoPercentual);
    } else {
      itensPorContaMap.set(key, { ...item });
    }
  }
  const itensPorConta = Array.from(itensPorContaMap.values());

  // Agrupar por centro de custo
  const itensPorCentroMap = new Map<number | null, ItemAnalise>();
  for (const item of itens) {
    const key = item.centroCustoId;
    const existente = itensPorCentroMap.get(key);
    if (existente) {
      existente.valorOrcado += item.valorOrcado;
      existente.valorRealizado += item.valorRealizado;
      existente.variacao = existente.valorOrcado - existente.valorRealizado;
      existente.variacaoPercentual =
        existente.valorOrcado === 0
          ? 0
          : ((existente.valorRealizado - existente.valorOrcado) / existente.valorOrcado) * 100;
      existente.percentualRealizacao =
        existente.valorOrcado === 0
          ? 0
          : (existente.valorRealizado / existente.valorOrcado) * 100;
      existente.status = determinarStatusItem(existente.variacaoPercentual);
    } else {
      itensPorCentroMap.set(key, { ...item });
    }
  }
  const itensPorCentro = Array.from(itensPorCentroMap.values());

  // Calcular evolução mensal
  const evolucaoMensal = calcularEvolucaoMensal(itens);

  // Gerar alertas
  const alertas = gerarAlertas(itens, resumo, orcamento.dataInicio, orcamento.dataFim);

  // Calcular projeção
  const mesesTotal = calcularMesesEntreDatas(orcamento.dataInicio, orcamento.dataFim);
  const mesesDecorridos = calcularMesesDecorridos(orcamento.dataInicio, orcamento.dataFim);
  const projecao = calcularProjecaoOrcamentaria(totalRealizado, mesesDecorridos, mesesTotal, variacaoPercentual);

  const result: AnaliseOrcamentaria = {
    orcamento,
    periodo: {
      dataInicio: orcamento.dataInicio,
      dataFim: orcamento.dataFim,
      mesesTotal,
      mesesDecorridos,
    },
    resumo,
    itensPorConta,
    itensPorCentro,
    evolucaoMensal,
    alertas,
    projecao,
  };

  await setCached(cacheKey, result, CACHE_TTL);
  return result;
};

/**
 * Buscar resumo orçamentário consolidado
 */
export const buscarResumoOrcamentario = async (orcamentoId: number): Promise<ResumoOrcamentario | null> => {
  const cacheKey = `${CACHE_PREFIX}:resumo:${orcamentoId}`;
  const cached = await getCached<ResumoOrcamentario>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('v_orcamento_vs_realizado')
    .select('valor_orcado, valor_realizado')
    .eq('orcamento_id', orcamentoId);

  if (error) {
    throw new Error(`Erro ao buscar resumo orçamentário: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return null;
  }

  const totalOrcado = data.reduce((acc, item) => acc + Number(item.valor_orcado), 0);
  const totalRealizado = data.reduce((acc, item) => acc + Number(item.valor_realizado), 0);
  const variacao = totalOrcado - totalRealizado;
  const variacaoPercentual = totalOrcado === 0 ? 0 : ((totalRealizado - totalOrcado) / totalOrcado) * 100;
  const percentualRealizacao = totalOrcado === 0 ? 0 : (totalRealizado / totalOrcado) * 100;

  const result: ResumoOrcamentario = {
    totalOrcado,
    totalRealizado,
    variacao,
    variacaoPercentual,
    percentualRealizacao,
  };

  await setCached(cacheKey, result, CACHE_TTL);
  return result;
};

/**
 * Buscar alertas de desvios orçamentários
 */
export const buscarAlertasDesvios = async (
  orcamentoId: number,
  limiteAtencao: number = 10,
  limiteCritico: number = 20
): Promise<AlertaOrcamentario[]> => {
  const cacheKey = `${CACHE_PREFIX}:alertas:${orcamentoId}:${limiteAtencao}:${limiteCritico}`;
  const cached = await getCached<AlertaOrcamentario[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('v_orcamento_vs_realizado')
    .select('*')
    .eq('orcamento_id', orcamentoId);

  if (error) {
    throw new Error(`Erro ao buscar alertas de desvios: ${error.message}`);
  }

  const itens = (data || []).map(mapearItemAnalise);
  const alertas: AlertaOrcamentario[] = [];

  for (const item of itens) {
    const percentualAbsoluto = Math.abs(item.variacaoPercentual);

    if (percentualAbsoluto > limiteCritico) {
      const tipo = item.variacaoPercentual > 0 ? 'desvio_positivo' : 'desvio_negativo';
      alertas.push({
        tipo,
        mensagem: `${item.contaContabilCodigo} - ${item.contaContabilNome}: Desvio de ${item.variacaoPercentual.toFixed(1)}%`,
        severidade: 'error',
        contaContabilId: item.contaContabilId,
        contaContabilCodigo: item.contaContabilCodigo,
        contaContabilNome: item.contaContabilNome,
        centroCustoId: item.centroCustoId ?? undefined,
        valorOrcado: item.valorOrcado,
        valorRealizado: item.valorRealizado,
        variacaoPercentual: item.variacaoPercentual,
      });
    } else if (percentualAbsoluto > limiteAtencao) {
      const tipo = item.variacaoPercentual > 0 ? 'desvio_positivo' : 'desvio_negativo';
      alertas.push({
        tipo,
        mensagem: `${item.contaContabilCodigo} - ${item.contaContabilNome}: Desvio de ${item.variacaoPercentual.toFixed(1)}%`,
        severidade: 'warning',
        contaContabilId: item.contaContabilId,
        contaContabilCodigo: item.contaContabilCodigo,
        contaContabilNome: item.contaContabilNome,
        centroCustoId: item.centroCustoId ?? undefined,
        valorOrcado: item.valorOrcado,
        valorRealizado: item.valorRealizado,
        variacaoPercentual: item.variacaoPercentual,
      });
    }
  }

  // Ordenar por severidade (crítico primeiro) e depois por percentual
  alertas.sort((a, b) => {
    if (a.severidade === 'error' && b.severidade !== 'error') return -1;
    if (a.severidade !== 'error' && b.severidade === 'error') return 1;
    return Math.abs(b.variacaoPercentual || 0) - Math.abs(a.variacaoPercentual || 0);
  });

  await setCached(cacheKey, alertas, CACHE_TTL);
  return alertas;
};

/**
 * Buscar evolução mensal do orçamento
 */
export const buscarEvolucaoMensal = async (orcamentoId: number): Promise<EvolucaoMensal[]> => {
  const cacheKey = `${CACHE_PREFIX}:evolucao:${orcamentoId}`;
  const cached = await getCached<EvolucaoMensal[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('v_orcamento_vs_realizado')
    .select('mes, valor_orcado, valor_realizado')
    .eq('orcamento_id', orcamentoId)
    .not('mes', 'is', null)
    .order('mes', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar evolução mensal: ${error.message}`);
  }

  // Agrupar por mês
  const mesesMap = new Map<number, { orcado: number; realizado: number }>();
  for (const item of data || []) {
    const mes = item.mes!;
    const existente = mesesMap.get(mes);
    if (existente) {
      existente.orcado += Number(item.valor_orcado);
      existente.realizado += Number(item.valor_realizado);
    } else {
      mesesMap.set(mes, {
        orcado: Number(item.valor_orcado),
        realizado: Number(item.valor_realizado),
      });
    }
  }

  const result: EvolucaoMensal[] = [];
  let acumuladoOrcado = 0;
  let acumuladoRealizado = 0;

  for (let mes = 1; mes <= 12; mes++) {
    const valores = mesesMap.get(mes);
    if (valores) {
      acumuladoOrcado += valores.orcado;
      acumuladoRealizado += valores.realizado;
      const variacao = valores.orcado - valores.realizado;
      const variacaoPercentual =
        valores.orcado === 0 ? 0 : ((valores.realizado - valores.orcado) / valores.orcado) * 100;

      result.push({
        mes,
        mesNome: getNomeMes(mes),
        valorOrcado: valores.orcado,
        valorRealizado: valores.realizado,
        variacao,
        variacaoPercentual,
        acumuladoOrcado,
        acumuladoRealizado,
      });
    }
  }

  await setCached(cacheKey, result, CACHE_TTL);
  return result;
};

/**
 * Buscar comparativo entre orçamentos de anos diferentes
 */
export const buscarComparativoAnual = async (anos: number[]): Promise<ComparativoOrcamento[]> => {
  const cacheKey = generateCacheKey(`${CACHE_PREFIX}:comparativo`, { anos });
  const cached = await getCached<ComparativoOrcamento[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = createServiceClient();

  const { data: orcamentos, error: erroOrcamentos } = await supabase
    .from('orcamentos')
    .select('id, nome, ano, periodo')
    .in('ano', anos)
    .order('ano', { ascending: true });

  if (erroOrcamentos) {
    throw new Error(`Erro ao buscar orçamentos para comparativo: ${erroOrcamentos.message}`);
  }

  const result: ComparativoOrcamento[] = [];

  for (const orcamento of orcamentos || []) {
    const resumo = await buscarResumoOrcamentario(orcamento.id);
    if (resumo) {
      result.push({
        orcamentoId: orcamento.id,
        orcamentoNome: orcamento.nome,
        ano: orcamento.ano,
        periodo: orcamento.periodo,
        totalOrcado: resumo.totalOrcado,
        totalRealizado: resumo.totalRealizado,
        variacao: resumo.variacao,
        percentualRealizacao: resumo.percentualRealizacao,
      });
    }
  }

  await setCached(cacheKey, result, CACHE_TTL);
  return result;
};

/**
 * Buscar projeção orçamentária
 */
export const buscarProjecaoOrcamentaria = async (orcamentoId: number): Promise<ProjecaoOrcamentaria | null> => {
  const cacheKey = `${CACHE_PREFIX}:projecao:${orcamentoId}`;
  const cached = await getCached<ProjecaoOrcamentaria>(cacheKey);
  if (cached) {
    return cached;
  }

  const orcamento = await buscarOrcamentoPorId(orcamentoId);
  if (!orcamento) {
    return null;
  }

  const resumo = await buscarResumoOrcamentario(orcamentoId);
  if (!resumo) {
    return null;
  }

  const mesesTotal = calcularMesesEntreDatas(orcamento.dataInicio, orcamento.dataFim);
  const mesesDecorridos = calcularMesesDecorridos(orcamento.dataInicio, orcamento.dataFim);

  const result = calcularProjecaoOrcamentaria(
    resumo.totalRealizado,
    mesesDecorridos,
    mesesTotal,
    resumo.variacaoPercentual
  );

  await setCached(cacheKey, result, CACHE_TTL);
  return result;
};

/**
 * Atualizar view materializada
 */
export const atualizarViewMaterializada = async (): Promise<void> => {
  const supabase = createServiceClient();

  const { error } = await supabase.rpc('refresh_orcamento_vs_realizado');

  if (error) {
    throw new Error(`Erro ao atualizar view materializada: ${error.message}`);
  }

  // Invalidar cache de análise
  await deletePattern(`${CACHE_PREFIX}:*`);
};

// ============================================================================
// Funções Auxiliares
// ============================================================================

/**
 * Calcula evolução mensal a partir dos itens
 */
function calcularEvolucaoMensal(itens: ItemAnalise[]): EvolucaoMensal[] {
  const mesesMap = new Map<number, { orcado: number; realizado: number }>();

  for (const item of itens) {
    if (item.mes !== null) {
      const existente = mesesMap.get(item.mes);
      if (existente) {
        existente.orcado += item.valorOrcado;
        existente.realizado += item.valorRealizado;
      } else {
        mesesMap.set(item.mes, {
          orcado: item.valorOrcado,
          realizado: item.valorRealizado,
        });
      }
    }
  }

  const result: EvolucaoMensal[] = [];
  let acumuladoOrcado = 0;
  let acumuladoRealizado = 0;

  for (let mes = 1; mes <= 12; mes++) {
    const valores = mesesMap.get(mes);
    if (valores) {
      acumuladoOrcado += valores.orcado;
      acumuladoRealizado += valores.realizado;
      const variacao = valores.orcado - valores.realizado;
      const variacaoPercentual =
        valores.orcado === 0 ? 0 : ((valores.realizado - valores.orcado) / valores.orcado) * 100;

      result.push({
        mes,
        mesNome: getNomeMes(mes),
        valorOrcado: valores.orcado,
        valorRealizado: valores.realizado,
        variacao,
        variacaoPercentual,
        acumuladoOrcado,
        acumuladoRealizado,
      });
    }
  }

  return result;
}

/**
 * Gera alertas baseados nos itens e resumo
 */
function gerarAlertas(
  itens: ItemAnalise[],
  resumo: ResumoOrcamentario,
  dataInicio: string,
  dataFim: string
): AlertaOrcamentario[] {
  const alertas: AlertaOrcamentario[] = [];
  const hoje = new Date();
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);

  // Alerta se orçamento ainda não iniciou
  if (hoje < inicio) {
    alertas.push({
      tipo: 'nao_iniciado',
      mensagem: `Orçamento ainda não iniciou. Início previsto: ${new Date(dataInicio).toLocaleDateString('pt-BR')}`,
      severidade: 'info',
    });
  }

  // Alerta se orçamento está atrasado (passou da data fim)
  if (hoje > fim && resumo.percentualRealizacao < 100) {
    alertas.push({
      tipo: 'atrasado',
      mensagem: `Período do orçamento encerrado com ${resumo.percentualRealizacao.toFixed(1)}% de realização`,
      severidade: 'warning',
    });
  }

  // Alertas por item com desvio
  for (const item of itens) {
    const percentualAbsoluto = Math.abs(item.variacaoPercentual);

    if (percentualAbsoluto > 20) {
      const tipo = item.variacaoPercentual > 0 ? 'desvio_positivo' : 'desvio_negativo';
      alertas.push({
        tipo,
        mensagem: `${item.contaContabilCodigo} - ${item.contaContabilNome}: Desvio crítico de ${item.variacaoPercentual.toFixed(1)}%`,
        severidade: 'error',
        contaContabilId: item.contaContabilId,
        contaContabilCodigo: item.contaContabilCodigo,
        contaContabilNome: item.contaContabilNome,
        centroCustoId: item.centroCustoId ?? undefined,
        valorOrcado: item.valorOrcado,
        valorRealizado: item.valorRealizado,
        variacaoPercentual: item.variacaoPercentual,
      });
    } else if (percentualAbsoluto > 10) {
      const tipo = item.variacaoPercentual > 0 ? 'desvio_positivo' : 'desvio_negativo';
      alertas.push({
        tipo,
        mensagem: `${item.contaContabilCodigo} - ${item.contaContabilNome}: Desvio de ${item.variacaoPercentual.toFixed(1)}%`,
        severidade: 'warning',
        contaContabilId: item.contaContabilId,
        contaContabilCodigo: item.contaContabilCodigo,
        contaContabilNome: item.contaContabilNome,
        centroCustoId: item.centroCustoId ?? undefined,
        valorOrcado: item.valorOrcado,
        valorRealizado: item.valorRealizado,
        variacaoPercentual: item.variacaoPercentual,
      });
    }
  }

  // Ordenar por severidade
  alertas.sort((a, b) => {
    const ordem = { error: 0, warning: 1, info: 2 };
    return ordem[a.severidade] - ordem[b.severidade];
  });

  return alertas;
}

/**
 * Calcula projeção orçamentária
 */
function calcularProjecaoOrcamentaria(
  valorRealizado: number,
  mesesDecorridos: number,
  mesesTotais: number,
  variacaoPercentual: number
): ProjecaoOrcamentaria {
  const { valorProjetado, confiabilidade } = calcularProjecao(valorRealizado, mesesDecorridos, mesesTotais);
  const tendencia = determinarTendencia(variacaoPercentual);

  return {
    periodo: `${mesesTotais} meses`,
    valorProjetado,
    baseadoEmMeses: mesesDecorridos,
    tendencia,
    confiabilidade,
  };
}

// ============================================================================
// Invalidação de Cache
// ============================================================================

/**
 * Invalidar cache de análise orçamentária
 */
export const invalidateAnaliseOrcamentariaCache = async (orcamentoId?: number): Promise<void> => {
  if (orcamentoId) {
    await deletePattern(`${CACHE_PREFIX}:${orcamentoId}:*`);
    await deletePattern(`${CACHE_PREFIX}:resumo:${orcamentoId}`);
    await deletePattern(`${CACHE_PREFIX}:alertas:${orcamentoId}:*`);
    await deletePattern(`${CACHE_PREFIX}:evolucao:${orcamentoId}`);
    await deletePattern(`${CACHE_PREFIX}:projecao:${orcamentoId}`);
  } else {
    await deletePattern(`${CACHE_PREFIX}:*`);
  }
};
