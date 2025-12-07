/**
 * Serviço de persistência para DRE (Demonstração de Resultado do Exercício)
 * Gerencia queries na view v_dre e cache Redis
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import {
  getCached,
  setCached,
  deletePattern,
  generateCacheKey,
  withCache,
} from '@/backend/utils/redis/cache-utils';
import type {
  ItemDRE,
  CategoriaDRE,
  EvolucaoDRE,
  ResumoDRE,
  VDRERecord,
  TipoConta,
} from '@/backend/types/financeiro/dre.types';
import {
  getNomeMes,
  calcularPercentualReceita,
  agruparPorCategoria,
} from '@/backend/types/financeiro/dre.types';

// ============================================================================
// Constantes de Cache
// ============================================================================

const CACHE_PREFIX = 'dre';
const CACHE_TTL = 600; // 10 minutos
const CACHE_TTL_EVOLUCAO = 900; // 15 minutos para evolução (muda menos)

// ============================================================================
// Mappers
// ============================================================================

/**
 * Converte registro da view v_dre para interface ItemDRE
 */
const mapViewRecordToItemDRE = (
  registro: VDRERecord,
  receitaLiquida: number
): ItemDRE => {
  return {
    contaContabilId: registro.conta_contabil_id,
    contaContabilCodigo: registro.conta_codigo,
    contaContabilNome: registro.conta_nome,
    tipoConta: registro.tipo_conta as TipoConta,
    categoria: registro.categoria,
    valor: Number(registro.valor_total),
    percentualReceita: calcularPercentualReceita(Number(registro.valor_total), receitaLiquida),
    quantidadeLancamentos: registro.quantidade_lancamentos,
  };
};

// ============================================================================
// Funções de Busca
// ============================================================================

/**
 * Busca dados agregados da DRE para um período
 * @param dataInicio Data inicial do período (YYYY-MM-DD)
 * @param dataFim Data final do período (YYYY-MM-DD)
 */
export async function buscarDadosDRE(
  dataInicio: string,
  dataFim: string
): Promise<ItemDRE[]> {
  const cacheKey = generateCacheKey(CACHE_PREFIX, { dataInicio, dataFim });

  return withCache(
    cacheKey,
    async () => {
      console.log('📊 Buscando dados DRE...', { dataInicio, dataFim });

      const supabase = createServiceClient();

      // Extrair ano/mês do período
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      const anoInicio = inicio.getFullYear();
      const mesInicio = inicio.getMonth() + 1;
      const anoFim = fim.getFullYear();
      const mesFim = fim.getMonth() + 1;

      // Query na view v_dre
      let query = supabase
        .from('v_dre')
        .select('*');

      // Filtro por período
      if (anoInicio === anoFim) {
        // Mesmo ano
        query = query
          .eq('ano', anoInicio)
          .gte('mes', mesInicio)
          .lte('mes', mesFim);
      } else {
        // Anos diferentes - usar período completo
        query = query.or(
          `and(ano.eq.${anoInicio},mes.gte.${mesInicio}),and(ano.eq.${anoFim},mes.lte.${mesFim})`
        );
      }

      const { data, error } = await query.order('conta_codigo');

      if (error) {
        console.error('❌ Erro ao buscar dados DRE:', error);
        throw new Error(`Erro ao buscar dados DRE: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log('ℹ️ Nenhum dado encontrado para o período');
        return [];
      }

      // Calcular receita líquida para percentuais
      const receitaLiquida = data
        .filter((r: VDRERecord) => r.tipo_conta === 'receita')
        .reduce((sum: number, r: VDRERecord) => sum + Number(r.valor_total), 0);

      // Mapear registros
      const itens = (data as VDRERecord[]).map((registro) =>
        mapViewRecordToItemDRE(registro, receitaLiquida)
      );

      console.log(`✅ Encontrados ${itens.length} itens DRE`);
      return itens;
    },
    CACHE_TTL
  );
}

/**
 * Busca receitas agrupadas por categoria
 */
export async function buscarReceitasPorCategoria(
  dataInicio: string,
  dataFim: string
): Promise<CategoriaDRE[]> {
  const itens = await buscarDadosDRE(dataInicio, dataFim);
  const receitas = itens.filter((item) => item.tipoConta === 'receita');
  return agruparPorCategoria(receitas);
}

/**
 * Busca despesas agrupadas por categoria
 */
export async function buscarDespesasPorCategoria(
  dataInicio: string,
  dataFim: string
): Promise<CategoriaDRE[]> {
  const itens = await buscarDadosDRE(dataInicio, dataFim);
  const despesas = itens.filter((item) => item.tipoConta === 'despesa');
  return agruparPorCategoria(despesas);
}

/**
 * Busca evolução mensal do DRE para um ano
 */
export async function buscarEvolucaoMensal(ano: number): Promise<EvolucaoDRE[]> {
  const cacheKey = generateCacheKey(`${CACHE_PREFIX}:evolucao`, { ano });

  return withCache(
    cacheKey,
    async () => {
      console.log('📊 Buscando evolução mensal DRE...', { ano });

      const supabase = createServiceClient();

      // Query agregada por mês diretamente na tabela de lançamentos
      // para ter mais controle sobre os cálculos
      const { data, error } = await supabase.rpc('calcular_evolucao_dre', {
        p_ano: ano,
      });

      // Se RPC não existir, fazer query manual
      if (error && error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('ℹ️ RPC não disponível, usando query manual');
        return await buscarEvolucaoMensalManual(ano);
      }

      if (error) {
        console.error('❌ Erro ao buscar evolução DRE:', error);
        throw new Error(`Erro ao buscar evolução DRE: ${error.message}`);
      }

      if (!data) {
        return gerarEvolucaoVazia(ano);
      }

      return data as EvolucaoDRE[];
    },
    CACHE_TTL_EVOLUCAO
  );
}

/**
 * Busca evolução mensal de forma manual (sem RPC)
 */
async function buscarEvolucaoMensalManual(ano: number): Promise<EvolucaoDRE[]> {
  const supabase = createServiceClient();

  // Buscar dados da view v_dre para o ano
  const { data, error } = await supabase
    .from('v_dre')
    .select('*')
    .eq('ano', ano)
    .order('mes');

  if (error) {
    console.error('❌ Erro ao buscar evolução manual:', error);
    return gerarEvolucaoVazia(ano);
  }

  if (!data || data.length === 0) {
    return gerarEvolucaoVazia(ano);
  }

  // Agrupar por mês e calcular métricas
  const mesesMap = new Map<number, { receitas: number; despesas: number }>();

  for (const registro of data as VDRERecord[]) {
    const atual = mesesMap.get(registro.mes) || { receitas: 0, despesas: 0 };
    if (registro.tipo_conta === 'receita') {
      atual.receitas += Number(registro.valor_total);
    } else {
      atual.despesas += Number(registro.valor_total);
    }
    mesesMap.set(registro.mes, atual);
  }

  // Gerar array de 12 meses
  const evolucao: EvolucaoDRE[] = [];
  for (let mes = 1; mes <= 12; mes++) {
    const dados = mesesMap.get(mes) || { receitas: 0, despesas: 0 };
    const receitaLiquida = dados.receitas;
    const lucroOperacional = dados.receitas - dados.despesas;
    const lucroLiquido = lucroOperacional; // Simplificado - sem impostos detalhados
    const margemLiquida = receitaLiquida > 0
      ? Number(((lucroLiquido / receitaLiquida) * 100).toFixed(2))
      : 0;

    evolucao.push({
      mes,
      mesNome: getNomeMes(mes),
      ano,
      periodoCompleto: `${ano}-${mes.toString().padStart(2, '0')}`,
      receitaLiquida,
      lucroOperacional,
      lucroLiquido,
      margemLiquida,
    });
  }

  return evolucao;
}

/**
 * Gera evolução vazia para um ano (12 meses zerados)
 */
function gerarEvolucaoVazia(ano: number): EvolucaoDRE[] {
  return Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    mesNome: getNomeMes(i + 1),
    ano,
    periodoCompleto: `${ano}-${(i + 1).toString().padStart(2, '0')}`,
    receitaLiquida: 0,
    lucroOperacional: 0,
    lucroLiquido: 0,
    margemLiquida: 0,
  }));
}

/**
 * Busca valores orçados para comparativo
 */
export async function buscarDREOrcado(
  dataInicio: string,
  dataFim: string
): Promise<ResumoDRE | null> {
  const cacheKey = generateCacheKey(`${CACHE_PREFIX}:orcado`, { dataInicio, dataFim });

  return withCache(
    cacheKey,
    async () => {
      console.log('📊 Buscando DRE orçado...', { dataInicio, dataFim });

      const supabase = createServiceClient();

      // Buscar na view v_orcamento_vs_realizado
      const { data, error } = await supabase
        .from('v_orcamento_vs_realizado')
        .select('*')
        .gte('orcamento_data_inicio', dataInicio)
        .lte('orcamento_data_fim', dataFim);

      if (error) {
        console.warn('⚠️ Erro ao buscar DRE orçado:', error.message);
        return null;
      }

      if (!data || data.length === 0) {
        console.log('ℹ️ Nenhum orçamento encontrado para o período');
        return null;
      }

      // Agregar valores orçados por tipo de conta
      let receitasOrcadas = 0;
      let despesasOrcadas = 0;

      for (const item of data) {
        if (item.tipo_conta === 'receita') {
          receitasOrcadas += Number(item.valor_orcado || 0);
        } else {
          despesasOrcadas += Number(item.valor_orcado || 0);
        }
      }

      // Retornar resumo simplificado do orçado
      const receitaLiquida = receitasOrcadas;
      const lucroLiquido = receitasOrcadas - despesasOrcadas;
      const margemLiquida = receitaLiquida > 0
        ? Number(((lucroLiquido / receitaLiquida) * 100).toFixed(2))
        : 0;

      return {
        receitaBruta: receitasOrcadas,
        deducoes: 0,
        receitaLiquida,
        custosDiretos: 0,
        lucroBruto: receitaLiquida,
        despesasOperacionais: despesasOrcadas,
        lucroOperacional: lucroLiquido,
        depreciacaoAmortizacao: 0,
        ebitda: lucroLiquido,
        despesasFinanceiras: 0,
        receitasFinanceiras: 0,
        resultadoFinanceiro: 0,
        resultadoAntesImposto: lucroLiquido,
        impostos: 0,
        lucroLiquido,
        margemBruta: 100,
        margemOperacional: margemLiquida,
        margemLiquida,
        margemEBITDA: margemLiquida,
      };
    },
    CACHE_TTL
  );
}

/**
 * Busca totais rápidos para um período (sem detalhes)
 */
export async function buscarTotaisDRE(
  dataInicio: string,
  dataFim: string
): Promise<{ totalReceitas: number; totalDespesas: number }> {
  const cacheKey = generateCacheKey(`${CACHE_PREFIX}:totais`, { dataInicio, dataFim });

  return withCache(
    cacheKey,
    async () => {
      const supabase = createServiceClient();

      // Extrair período
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      const anoInicio = inicio.getFullYear();
      const mesInicio = inicio.getMonth() + 1;
      const anoFim = fim.getFullYear();
      const mesFim = fim.getMonth() + 1;

      let query = supabase
        .from('v_dre')
        .select('tipo_conta, valor_total');

      if (anoInicio === anoFim) {
        query = query
          .eq('ano', anoInicio)
          .gte('mes', mesInicio)
          .lte('mes', mesFim);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar totais DRE:', error);
        return { totalReceitas: 0, totalDespesas: 0 };
      }

      let totalReceitas = 0;
      let totalDespesas = 0;

      for (const item of data || []) {
        if (item.tipo_conta === 'receita') {
          totalReceitas += Number(item.valor_total);
        } else {
          totalDespesas += Number(item.valor_total);
        }
      }

      return { totalReceitas, totalDespesas };
    },
    CACHE_TTL
  );
}

// ============================================================================
// Funções de Manutenção
// ============================================================================

/**
 * Atualiza a view materializada v_dre
 */
export async function atualizarViewMaterializada(): Promise<void> {
  console.log('🔄 Atualizando view materializada v_dre...');

  const supabase = createServiceClient();

  try {
    const { error } = await supabase.rpc('refresh_v_dre');

    if (error) {
      console.error('❌ Erro ao atualizar view:', error);
      throw new Error(`Erro ao atualizar view: ${error.message}`);
    }

    console.log('✅ View v_dre atualizada com sucesso');
  } catch (error) {
    console.error('❌ Erro ao atualizar view materializada:', error);
    throw error;
  }
}

/**
 * Invalida cache do DRE
 * @param dataInicio Se fornecido, invalida apenas cache do período específico
 * @param dataFim Se fornecido junto com dataInicio, invalida período específico
 */
export async function invalidateDRECache(
  dataInicio?: string,
  dataFim?: string
): Promise<number> {
  console.log('🗑️ Invalidando cache DRE...');

  let pattern: string;

  if (dataInicio && dataFim) {
    // Invalida cache específico do período
    const cacheKey = generateCacheKey(CACHE_PREFIX, { dataInicio, dataFim });
    pattern = `${cacheKey}*`;
  } else {
    // Invalida todo o cache de DRE
    pattern = `${CACHE_PREFIX}:*`;
  }

  const deleted = await deletePattern(pattern);
  console.log(`✅ ${deleted} chaves de cache invalidadas`);

  return deleted;
}

/**
 * Invalida cache do DRE quando um lançamento é confirmado/cancelado
 * @param dataCompetencia Data de competência do lançamento
 */
export async function invalidateDRECacheOnLancamento(
  dataCompetencia: string
): Promise<void> {
  console.log('🔄 Invalidando cache DRE por lançamento...', { dataCompetencia });

  // Extrair ano/mês
  const data = new Date(dataCompetencia);
  const ano = data.getFullYear();
  const mes = data.getMonth() + 1;

  // Invalidar cache de evolução do ano
  await deletePattern(`${CACHE_PREFIX}:evolucao:*${ano}*`);

  // Invalidar cache de períodos que incluem este mês
  // Padrão: invalida qualquer cache que pode conter este mês
  await deletePattern(`${CACHE_PREFIX}:*${ano}-${mes.toString().padStart(2, '0')}*`);

  // Invalidar totais
  await deletePattern(`${CACHE_PREFIX}:totais:*`);

  // Invalidar orçado (pode ser afetado)
  await deletePattern(`${CACHE_PREFIX}:orcado:*`);

  console.log('✅ Cache DRE invalidado para período:', `${ano}-${mes}`);
}
