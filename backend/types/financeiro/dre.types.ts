/**
 * Types e interfaces para o módulo de DRE (Demonstração de Resultado do Exercício)
 * Sistema de Gestão Financeira (SGF)
 *
 * DRE apresenta receitas e despesas por período, permitindo análise de
 * resultado operacional, EBITDA e lucro líquido com comparativos.
 */

// ============================================================================
// Enums e Types de Domínio
// ============================================================================

/**
 * Período do DRE
 */
export type PeriodoDRE = 'mensal' | 'trimestral' | 'anual';

/**
 * Tipo de comparativo
 */
export type TipoComparativo = 'periodo_anterior' | 'orcado';

/**
 * Tipo de conta (receita ou despesa)
 */
export type TipoConta = 'receita' | 'despesa';

/**
 * Tendência da evolução
 */
export type TendenciaDRE = 'positiva' | 'neutra' | 'negativa';

// ============================================================================
// Interfaces Principais
// ============================================================================

/**
 * Item individual do DRE
 */
export interface ItemDRE {
  contaContabilId: number;
  contaContabilCodigo: string;
  contaContabilNome: string;
  tipoConta: TipoConta;
  categoria: string;
  valor: number;
  percentualReceita: number;
  quantidadeLancamentos: number;
}

/**
 * Agrupamento por categoria
 */
export interface CategoriaDRE {
  categoria: string;
  valor: number;
  percentualReceita: number;
  itens: ItemDRE[];
}

/**
 * Resumo completo da estrutura DRE
 */
export interface ResumoDRE {
  // Receitas
  receitaBruta: number;
  deducoes: number;
  receitaLiquida: number;

  // Custos e Despesas
  custosDiretos: number;
  lucroBruto: number;
  despesasOperacionais: number;
  lucroOperacional: number;

  // EBITDA
  depreciacaoAmortizacao: number;
  ebitda: number;

  // Resultado Financeiro
  despesasFinanceiras: number;
  receitasFinanceiras: number;
  resultadoFinanceiro: number;

  // Resultado Final
  resultadoAntesImposto: number;
  impostos: number;
  lucroLiquido: number;

  // Margens
  margemBruta: number;
  margemOperacional: number;
  margemLiquida: number;
  margemEBITDA: number;
}

/**
 * DRE completo
 */
export interface DRE {
  periodo: {
    dataInicio: string;
    dataFim: string;
    tipo: PeriodoDRE;
    descricao: string;
  };
  resumo: ResumoDRE;
  receitasPorCategoria: CategoriaDRE[];
  despesasPorCategoria: CategoriaDRE[];
  geradoEm: string;
}

/**
 * Variações entre períodos
 */
export interface VariacaoDRE {
  absoluta: number;
  percentual: number;
}

/**
 * Variações de todas as métricas
 */
export interface VariacoesDRE {
  receitaLiquida: VariacaoDRE;
  lucroBruto: VariacaoDRE;
  lucroOperacional: VariacaoDRE;
  ebitda: VariacaoDRE;
  lucroLiquido: VariacaoDRE;
  margemLiquida: VariacaoDRE;
}

/**
 * Comparativo entre DREs
 */
export interface ComparativoDRE {
  periodoAtual: DRE;
  periodoAnterior: DRE | null;
  orcado: ResumoDRE | null;
  variacoes: VariacoesDRE | null;
  variacoesOrcado: VariacoesDRE | null;
}

/**
 * Evolução mensal do DRE para gráficos
 */
export interface EvolucaoDRE {
  mes: number;
  mesNome: string;
  ano: number;
  periodoCompleto: string;
  receitaLiquida: number;
  lucroOperacional: number;
  lucroLiquido: number;
  margemLiquida: number;
}

// ============================================================================
// DTOs
// ============================================================================

/**
 * DTO para gerar DRE
 */
export interface GerarDREDTO {
  dataInicio: string;
  dataFim: string;
  tipo?: PeriodoDRE;
  incluirComparativo?: boolean;
  incluirOrcado?: boolean;
}

/**
 * Parâmetros para listar DREs
 */
export interface ListarDREsParams {
  ano?: number;
  tipo?: PeriodoDRE;
  ordenarPor?: 'periodo' | 'receita' | 'lucro';
  ordem?: 'asc' | 'desc';
}

/**
 * Parâmetros para buscar evolução
 */
export interface BuscarEvolucaoParams {
  ano: number;
  meses?: number; // últimos N meses, default 12
}

// ============================================================================
// Respostas da API
// ============================================================================

/**
 * Resposta da API de DRE
 */
export interface DREResponse {
  dre: DRE;
  comparativo?: ComparativoDRE;
  geradoEm: string;
}

/**
 * Resposta da API de evolução
 */
export interface EvolucaoResponse {
  evolucao: EvolucaoDRE[];
  ano: number;
  geradoEm: string;
}

// ============================================================================
// Tipos internos (mapeamento do banco)
// ============================================================================

/**
 * Registro da view v_dre
 */
export interface VDRERecord {
  ano: number;
  mes: number;
  periodo_completo: string;
  conta_contabil_id: number;
  conta_codigo: string;
  conta_nome: string;
  tipo_conta: string;
  categoria: string;
  valor_total: number;
  quantidade_lancamentos: number;
}

// ============================================================================
// Validadores e Type Guards
// ============================================================================

const PERIODOS_VALIDOS: PeriodoDRE[] = ['mensal', 'trimestral', 'anual'];
const TIPOS_COMPARATIVO: TipoComparativo[] = ['periodo_anterior', 'orcado'];

/**
 * Type guard para verificar período válido
 */
export const isPeriodoDREValido = (periodo: unknown): periodo is PeriodoDRE => {
  return typeof periodo === 'string' && PERIODOS_VALIDOS.includes(periodo as PeriodoDRE);
};

/**
 * Type guard para verificar tipo de comparativo válido
 */
export const isTipoComparativoValido = (tipo: unknown): tipo is TipoComparativo => {
  return typeof tipo === 'string' && TIPOS_COMPARATIVO.includes(tipo as TipoComparativo);
};

/**
 * Validar DTO de geração de DRE
 */
export const validarGerarDREDTO = (data: unknown): data is GerarDREDTO => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const dto = data as GerarDREDTO;

  // Campos obrigatórios
  if (!dto.dataInicio || typeof dto.dataInicio !== 'string') {
    return false;
  }
  if (!dto.dataFim || typeof dto.dataFim !== 'string') {
    return false;
  }

  // Validar datas
  const dataInicio = new Date(dto.dataInicio);
  const dataFim = new Date(dto.dataFim);

  if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
    return false;
  }

  if (dataFim <= dataInicio) {
    return false;
  }

  // Validar tipo se fornecido
  if (dto.tipo !== undefined && !isPeriodoDREValido(dto.tipo)) {
    return false;
  }

  return true;
};

/**
 * Type guard para verificar se é um DRE válido
 */
export const isDRE = (obj: unknown): obj is DRE => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'periodo' in obj &&
    'resumo' in obj &&
    'receitasPorCategoria' in obj &&
    'despesasPorCategoria' in obj
  );
};

// ============================================================================
// Labels para UI
// ============================================================================

export const PERIODO_DRE_LABELS: Record<PeriodoDRE, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  anual: 'Anual',
};

export const TENDENCIA_LABELS: Record<TendenciaDRE, string> = {
  positiva: 'Positiva',
  neutra: 'Neutra',
  negativa: 'Negativa',
};

/**
 * Lista de meses para seleção
 */
export const MESES: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

/**
 * Obtém nome do mês
 */
export const getNomeMes = (mes: number): string => {
  return MESES.find((m) => m.value === mes)?.label ?? '';
};

// ============================================================================
// Helpers de Cálculo
// ============================================================================

/**
 * Calcula margem como percentual
 */
export const calcularMargem = (valor: number, base: number): number => {
  if (base === 0) return 0;
  return Number(((valor / base) * 100).toFixed(2));
};

/**
 * Calcula EBITDA
 * EBITDA = Lucro Operacional + Depreciação + Amortização
 */
export const calcularEBITDA = (
  lucroOperacional: number,
  depreciacaoAmortizacao: number
): number => {
  return lucroOperacional + depreciacaoAmortizacao;
};

/**
 * Calcula variação entre dois valores
 */
export const calcularVariacao = (
  valorAtual: number,
  valorAnterior: number
): VariacaoDRE => {
  const absoluta = valorAtual - valorAnterior;
  const percentual = valorAnterior === 0
    ? (valorAtual === 0 ? 0 : 100)
    : Number((((valorAtual - valorAnterior) / Math.abs(valorAnterior)) * 100).toFixed(2));

  return { absoluta, percentual };
};

/**
 * Calcula percentual sobre receita líquida
 */
export const calcularPercentualReceita = (valor: number, receitaLiquida: number): number => {
  if (receitaLiquida === 0) return 0;
  return Number(((valor / receitaLiquida) * 100).toFixed(2));
};

/**
 * Determina tendência baseada em variação
 */
export const determinarTendencia = (variacaoPercentual: number): TendenciaDRE => {
  if (variacaoPercentual > 5) {
    return 'positiva';
  } else if (variacaoPercentual < -5) {
    return 'negativa';
  }
  return 'neutra';
};

/**
 * Agrupa itens por categoria
 */
export const agruparPorCategoria = (itens: ItemDRE[]): CategoriaDRE[] => {
  const grupos = new Map<string, ItemDRE[]>();

  for (const item of itens) {
    const atual = grupos.get(item.categoria) || [];
    atual.push(item);
    grupos.set(item.categoria, atual);
  }

  return Array.from(grupos.entries()).map(([categoria, itensCategoria]) => {
    const valor = itensCategoria.reduce((sum, item) => sum + item.valor, 0);
    const percentualReceita = itensCategoria.length > 0
      ? itensCategoria[0].percentualReceita // Será recalculado no business service
      : 0;

    return {
      categoria,
      valor,
      percentualReceita,
      itens: itensCategoria,
    };
  }).sort((a, b) => b.valor - a.valor);
};

/**
 * Gera descrição do período
 */
export const gerarDescricaoPeriodo = (
  dataInicio: string,
  dataFim: string,
  tipo: PeriodoDRE
): string => {
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);

  const mesInicio = inicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const mesFim = fim.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  switch (tipo) {
    case 'mensal':
      return mesInicio.charAt(0).toUpperCase() + mesInicio.slice(1);
    case 'trimestral':
      return `${mesInicio} a ${mesFim}`;
    case 'anual':
      return `Ano ${inicio.getFullYear()}`;
    default:
      return `${mesInicio} a ${mesFim}`;
  }
};

/**
 * Gera anos para seleção (últimos 3 + atual + próximo)
 */
export const gerarAnosParaSelecao = (): number[] => {
  const anoAtual = new Date().getFullYear();
  return [anoAtual - 3, anoAtual - 2, anoAtual - 1, anoAtual, anoAtual + 1];
};

// ============================================================================
// Categorias Padrão para Classificação DRE
// ============================================================================

/**
 * Categorias de receita para DRE
 */
export const CATEGORIAS_RECEITA = [
  'Honorários Advocatícios',
  'Honorários Sucumbência',
  'Êxito Processual',
  'Consultoria',
  'Receitas Financeiras',
  'Outras Receitas',
] as const;

/**
 * Categorias de dedução para DRE
 */
export const CATEGORIAS_DEDUCAO = [
  'Deduções',
  'Devoluções',
  'Descontos Concedidos',
  'Impostos sobre Receita',
] as const;

/**
 * Categorias de custo direto para DRE
 */
export const CATEGORIAS_CUSTO_DIRETO = [
  'Custos Diretos',
  'Custas Processuais',
  'Honorários Terceiros',
  'Peritos e Assistentes',
  'Despesas Processuais',
] as const;

/**
 * Categorias de despesa operacional para DRE
 */
export const CATEGORIAS_DESPESA_OPERACIONAL = [
  'Salários e Encargos',
  'Benefícios',
  'Aluguel',
  'Condomínio',
  'Energia Elétrica',
  'Água',
  'Telefone e Internet',
  'Material de Escritório',
  'Manutenção',
  'Seguros',
  'Marketing',
  'Sistemas e Software',
  'Despesas Administrativas',
  'Outras Despesas Operacionais',
] as const;

/**
 * Categorias de despesa financeira para DRE
 */
export const CATEGORIAS_DESPESA_FINANCEIRA = [
  'Despesas Financeiras',
  'Juros Pagos',
  'Taxas Bancárias',
  'IOF',
  'Multas',
] as const;

/**
 * Categorias de imposto para DRE
 */
export const CATEGORIAS_IMPOSTO = [
  'Impostos',
  'IRPJ',
  'CSLL',
  'PIS',
  'COFINS',
  'ISS',
  'Outros Impostos',
] as const;

/**
 * Mapeamento de categoria para grupo DRE
 */
export type GrupoDRE =
  | 'receita'
  | 'deducao'
  | 'custo_direto'
  | 'despesa_operacional'
  | 'despesa_financeira'
  | 'receita_financeira'
  | 'imposto'
  | 'depreciacacao';

/**
 * Classifica categoria em grupo DRE
 */
export const classificarCategoria = (categoria: string): GrupoDRE => {
  const cat = categoria.toLowerCase();

  if (CATEGORIAS_DEDUCAO.some(c => cat.includes(c.toLowerCase()))) {
    return 'deducao';
  }
  if (CATEGORIAS_CUSTO_DIRETO.some(c => cat.includes(c.toLowerCase()))) {
    return 'custo_direto';
  }
  if (CATEGORIAS_DESPESA_FINANCEIRA.some(c => cat.includes(c.toLowerCase()))) {
    return 'despesa_financeira';
  }
  if (cat.includes('receita financeira') || cat.includes('juros recebidos') || cat.includes('rendimentos')) {
    return 'receita_financeira';
  }
  if (CATEGORIAS_IMPOSTO.some(c => cat.includes(c.toLowerCase()))) {
    return 'imposto';
  }
  if (cat.includes('depreciação') || cat.includes('amortização')) {
    return 'depreciacacao';
  }
  if (CATEGORIAS_DESPESA_OPERACIONAL.some(c => cat.includes(c.toLowerCase()))) {
    return 'despesa_operacional';
  }

  // Default baseado no tipo de conta será tratado no business service
  return 'receita';
};
