/**
 * Serviço de Cálculo de DRE (Demonstração de Resultado do Exercício)
 * Gerencia a lógica de negócio para cálculo e análise da DRE
 */

import {
  buscarDadosDRE,
  buscarEvolucaoMensal,
  buscarDREOrcado,
} from '../persistence/dre-persistence.service';
import type {
  DRE,
  ResumoDRE,
  ComparativoDRE,
  EvolucaoDRE,
  CategoriaDRE,
  ItemDRE,
  GerarDREDTO,
  VariacoesDRE,
  PeriodoDRE,
} from '@/backend/types/financeiro/dre.types';
import {
  calcularMargem,
  calcularEBITDA,
  calcularVariacao,
  calcularPercentualReceita,
  agruparPorCategoria,
  gerarDescricaoPeriodo,
  classificarCategoria,
} from '@/backend/types/financeiro/dre.types';

// ============================================================================
// Funções Auxiliares de Classificação
// ============================================================================

/**
 * Separa itens em receitas e despesas
 */
function separarPorTipo(itens: ItemDRE[]): {
  receitas: ItemDRE[];
  despesas: ItemDRE[];
} {
  const receitas = itens.filter((item) => item.tipoConta === 'receita');
  const despesas = itens.filter((item) => item.tipoConta === 'despesa');
  return { receitas, despesas };
}

/**
 * Calcula soma de itens por grupo de categorias
 */
function somarPorGrupo(
  itens: ItemDRE[],
  grupos: readonly string[]
): number {
  return itens
    .filter((item) => {
      const cat = item.categoria.toLowerCase();
      return grupos.some((g) => cat.includes(g.toLowerCase()));
    })
    .reduce((sum, item) => sum + item.valor, 0);
}

/**
 * Calcula o resumo da DRE a partir dos itens
 */
function calcularResumoDRE(itens: ItemDRE[]): ResumoDRE {
  const { receitas, despesas } = separarPorTipo(itens);

  // === RECEITAS ===
  const receitaBruta = receitas.reduce((sum, item) => sum + item.valor, 0);

  // Deduções (devoluções, descontos, impostos sobre receita)
  const gruposDeducao = ['deduções', 'devoluções', 'descontos concedidos', 'impostos sobre receita'];
  const deducoes = somarPorGrupo(receitas, gruposDeducao);

  const receitaLiquida = receitaBruta - deducoes;

  // === CUSTOS DIRETOS ===
  const gruposCustoDireto = [
    'custos diretos',
    'custas processuais',
    'honorários terceiros',
    'peritos',
    'despesas processuais',
  ];
  const custosDiretos = somarPorGrupo(despesas, gruposCustoDireto);

  const lucroBruto = receitaLiquida - custosDiretos;

  // === DESPESAS OPERACIONAIS ===
  const gruposDespesaOperacional = [
    'salários',
    'encargos',
    'benefícios',
    'aluguel',
    'condomínio',
    'energia',
    'água',
    'telefone',
    'internet',
    'material',
    'manutenção',
    'seguros',
    'marketing',
    'sistemas',
    'software',
    'administrativas',
    'operacionais',
  ];
  const despesasOperacionais = somarPorGrupo(despesas, gruposDespesaOperacional);

  const lucroOperacional = lucroBruto - despesasOperacionais;

  // === DEPRECIAÇÃO E AMORTIZAÇÃO ===
  const gruposDepreciacao = ['depreciação', 'amortização'];
  const depreciacaoAmortizacao = somarPorGrupo(despesas, gruposDepreciacao);

  const ebitda = calcularEBITDA(lucroOperacional, depreciacaoAmortizacao);

  // === RESULTADO FINANCEIRO ===
  const gruposDespesaFinanceira = ['juros pagos', 'taxas bancárias', 'iof', 'multas', 'despesas financeiras'];
  const despesasFinanceiras = somarPorGrupo(despesas, gruposDespesaFinanceira);

  const gruposReceitaFinanceira = ['juros recebidos', 'rendimentos', 'receitas financeiras'];
  const receitasFinanceiras = somarPorGrupo(receitas, gruposReceitaFinanceira);

  const resultadoFinanceiro = receitasFinanceiras - despesasFinanceiras;

  const resultadoAntesImposto = lucroOperacional + resultadoFinanceiro;

  // === IMPOSTOS ===
  const gruposImposto = ['impostos', 'irpj', 'csll', 'pis', 'cofins', 'iss'];
  const impostos = somarPorGrupo(despesas, gruposImposto);

  const lucroLiquido = resultadoAntesImposto - impostos;

  // === MARGENS ===
  const margemBruta = calcularMargem(lucroBruto, receitaLiquida);
  const margemOperacional = calcularMargem(lucroOperacional, receitaLiquida);
  const margemLiquida = calcularMargem(lucroLiquido, receitaLiquida);
  const margemEBITDA = calcularMargem(ebitda, receitaLiquida);

  return {
    receitaBruta,
    deducoes,
    receitaLiquida,
    custosDiretos,
    lucroBruto,
    despesasOperacionais,
    lucroOperacional,
    depreciacaoAmortizacao,
    ebitda,
    despesasFinanceiras,
    receitasFinanceiras,
    resultadoFinanceiro,
    resultadoAntesImposto,
    impostos,
    lucroLiquido,
    margemBruta,
    margemOperacional,
    margemLiquida,
    margemEBITDA,
  };
}

/**
 * Agrupa itens por categoria com percentuais recalculados
 */
function agruparComPercentuais(
  itens: ItemDRE[],
  receitaLiquida: number
): CategoriaDRE[] {
  const grupos = agruparPorCategoria(itens);

  // Recalcular percentuais baseados na receita líquida total
  return grupos.map((grupo) => ({
    ...grupo,
    percentualReceita: calcularPercentualReceita(grupo.valor, receitaLiquida),
    itens: grupo.itens.map((item) => ({
      ...item,
      percentualReceita: calcularPercentualReceita(item.valor, receitaLiquida),
    })),
  }));
}

/**
 * Determina o tipo de período baseado nas datas
 */
function determinarTipoPeriodo(dataInicio: string, dataFim: string): PeriodoDRE {
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);

  const meses =
    (fim.getFullYear() - inicio.getFullYear()) * 12 +
    (fim.getMonth() - inicio.getMonth()) +
    1;

  if (meses <= 1) return 'mensal';
  if (meses <= 3) return 'trimestral';
  return 'anual';
}

// ============================================================================
// Funções Principais
// ============================================================================

/**
 * Calcula a DRE completa para um período
 */
export async function calcularDRE(dto: GerarDREDTO): Promise<DRE> {
  console.log('📊 Calculando DRE...', dto);

  try {
    // Buscar dados da view
    const itens = await buscarDadosDRE(dto.dataInicio, dto.dataFim);

    // Calcular resumo
    const resumo = calcularResumoDRE(itens);

    // Separar e agrupar por tipo
    const { receitas, despesas } = separarPorTipo(itens);

    const receitasPorCategoria = agruparComPercentuais(receitas, resumo.receitaLiquida);
    const despesasPorCategoria = agruparComPercentuais(despesas, resumo.receitaLiquida);

    // Determinar tipo de período
    const tipo = dto.tipo || determinarTipoPeriodo(dto.dataInicio, dto.dataFim);

    const dre: DRE = {
      periodo: {
        dataInicio: dto.dataInicio,
        dataFim: dto.dataFim,
        tipo,
        descricao: gerarDescricaoPeriodo(dto.dataInicio, dto.dataFim, tipo),
      },
      resumo,
      receitasPorCategoria,
      despesasPorCategoria,
      geradoEm: new Date().toISOString(),
    };

    console.log('✅ DRE calculado com sucesso');
    return dre;
  } catch (error) {
    console.error('❌ Erro ao calcular DRE:', error);
    throw error;
  }
}

/**
 * Calcula variações entre dois resumos
 */
function calcularVariacoes(atual: ResumoDRE, anterior: ResumoDRE): VariacoesDRE {
  return {
    receitaLiquida: calcularVariacao(atual.receitaLiquida, anterior.receitaLiquida),
    lucroBruto: calcularVariacao(atual.lucroBruto, anterior.lucroBruto),
    lucroOperacional: calcularVariacao(atual.lucroOperacional, anterior.lucroOperacional),
    ebitda: calcularVariacao(atual.ebitda, anterior.ebitda),
    lucroLiquido: calcularVariacao(atual.lucroLiquido, anterior.lucroLiquido),
    margemLiquida: calcularVariacao(atual.margemLiquida, anterior.margemLiquida),
  };
}

/**
 * Calcula período anterior baseado no período atual
 */
function calcularPeriodoAnterior(
  dataInicio: string,
  dataFim: string,
  tipo: PeriodoDRE
): { dataInicio: string; dataFim: string } {
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);

  // Calcular diferença em meses
  const mesesDiff =
    (fim.getFullYear() - inicio.getFullYear()) * 12 +
    (fim.getMonth() - inicio.getMonth()) +
    1;

  // Subtrair mesma quantidade de meses
  const novoInicio = new Date(inicio);
  novoInicio.setMonth(novoInicio.getMonth() - mesesDiff);

  const novoFim = new Date(inicio);
  novoFim.setDate(novoFim.getDate() - 1);

  return {
    dataInicio: novoInicio.toISOString().split('T')[0],
    dataFim: novoFim.toISOString().split('T')[0],
  };
}

/**
 * Calcula DRE com comparativo (período anterior e/ou orçado)
 */
export async function calcularComparativoDRE(dto: GerarDREDTO): Promise<ComparativoDRE> {
  console.log('📊 Calculando DRE comparativo...', dto);

  try {
    // Calcular DRE do período atual
    const periodoAtual = await calcularDRE(dto);

    let periodoAnterior: DRE | null = null;
    let variacoes: VariacoesDRE | null = null;

    // Calcular período anterior se solicitado
    if (dto.incluirComparativo) {
      const { dataInicio: inicioAnterior, dataFim: fimAnterior } = calcularPeriodoAnterior(
        dto.dataInicio,
        dto.dataFim,
        periodoAtual.periodo.tipo
      );

      try {
        periodoAnterior = await calcularDRE({
          dataInicio: inicioAnterior,
          dataFim: fimAnterior,
          tipo: dto.tipo,
        });

        variacoes = calcularVariacoes(periodoAtual.resumo, periodoAnterior.resumo);
      } catch (error) {
        console.warn('⚠️ Não foi possível calcular período anterior:', error);
      }
    }

    // Buscar orçado se solicitado
    let orcado: ResumoDRE | null = null;
    let variacoesOrcado: VariacoesDRE | null = null;

    if (dto.incluirOrcado) {
      try {
        orcado = await buscarDREOrcado(dto.dataInicio, dto.dataFim);

        if (orcado) {
          variacoesOrcado = calcularVariacoes(periodoAtual.resumo, orcado);
        }
      } catch (error) {
        console.warn('⚠️ Não foi possível buscar orçado:', error);
      }
    }

    const comparativo: ComparativoDRE = {
      periodoAtual,
      periodoAnterior,
      orcado,
      variacoes,
      variacoesOrcado,
    };

    console.log('✅ DRE comparativo calculado com sucesso');
    return comparativo;
  } catch (error) {
    console.error('❌ Erro ao calcular DRE comparativo:', error);
    throw error;
  }
}

/**
 * Calcula evolução anual do DRE
 */
export async function calcularEvolucaoAnual(ano: number): Promise<EvolucaoDRE[]> {
  console.log('📊 Calculando evolução anual DRE...', { ano });

  try {
    const evolucao = await buscarEvolucaoMensal(ano);
    console.log('✅ Evolução anual calculada com sucesso');
    return evolucao;
  } catch (error) {
    console.error('❌ Erro ao calcular evolução anual:', error);
    throw error;
  }
}

/**
 * Gera relatório resumido para dashboard
 */
export async function gerarResumoDashboard(
  dataInicio: string,
  dataFim: string
): Promise<{
  receitaLiquida: number;
  lucroOperacional: number;
  lucroLiquido: number;
  margemLiquida: number;
  status: 'positivo' | 'neutro' | 'negativo';
}> {
  const dre = await calcularDRE({ dataInicio, dataFim });

  const status =
    dre.resumo.lucroLiquido > 0
      ? 'positivo'
      : dre.resumo.lucroLiquido < 0
        ? 'negativo'
        : 'neutro';

  return {
    receitaLiquida: dre.resumo.receitaLiquida,
    lucroOperacional: dre.resumo.lucroOperacional,
    lucroLiquido: dre.resumo.lucroLiquido,
    margemLiquida: dre.resumo.margemLiquida,
    status,
  };
}
