/**
 * Tipos para DRE (Demonstração de Resultado do Exercício)
 * Definidos localmente na feature financeiro
 */

// ============================================================================
// Enums e tipos literais
// ============================================================================

export type PeriodoDRE = 'mensal' | 'trimestral' | 'semestral' | 'anual';
export type TipoComparativo = 'periodo_anterior' | 'mesmo_periodo_ano_anterior' | 'orcado';
export type TipoConta = 'receita' | 'despesa' | 'custo';
export type TendenciaDRE = 'crescente' | 'decrescente' | 'estavel';

// ============================================================================
// Interfaces
// ============================================================================

export interface ItemDRE {
    codigo: string;
    descricao: string;
    tipo: TipoConta;
    valor: number;
    percentualReceita: number;
    subItens?: ItemDRE[];
}

export interface CategoriaDRE {
    categoria: string;
    valor: number;
    percentualReceita: number;
}

export interface ResumoDRE {
    receitaBruta: number;
    deducoes: number;
    receitaLiquida: number;
    custosDiretos: number;
    lucroBruto: number;
    margemBruta: number;
    despesasOperacionais: number;
    lucroOperacional: number;
    margemOperacional: number;
    depreciacaoAmortizacao: number;
    ebitda: number;
    margemEBITDA: number;
    receitasFinanceiras: number;
    despesasFinanceiras: number;
    resultadoFinanceiro: number;
    resultadoAntesImposto: number;
    impostos: number;
    lucroLiquido: number;
    margemLiquida: number;
}

export interface DRE {
    periodo: {
        tipo: PeriodoDRE;
        dataInicio: string;
        dataFim: string;
        descricao: string;
    };
    resumo: ResumoDRE;
    receitasPorCategoria: CategoriaDRE[];
    despesasPorCategoria: CategoriaDRE[];
    geradoEm: string;
}

export interface VariacaoDRE {
    campo: string;
    valorAtual: number;
    valorComparativo: number;
    variacao: number;
    variacaoPercentual: number;
}

export interface VariacoesDRE {
    receitaLiquida: VariacaoDRE;
    lucroBruto: VariacaoDRE;
    lucroOperacional: VariacaoDRE;
    ebitda: VariacaoDRE;
    lucroLiquido: VariacaoDRE;
}

export interface ComparativoDRE {
    periodoAtual: DRE;
    periodoAnterior?: DRE;
    orcado?: DRE;
    variacoes?: Record<string, number>;
    variacoesOrcado?: Record<string, number>;
}

export interface EvolucaoDRE {
    mes: number;
    mesNome: string;
    ano: number;
    receitaLiquida: number;
    lucroOperacional: number;
    lucroLiquido: number;
    margemLiquida: number;
}

// ============================================================================
// DTOs
// ============================================================================

export interface GerarDREDTO {
    dataInicio: string;
    dataFim: string;
    tipo?: PeriodoDRE;
    incluirComparativo?: boolean;
    incluirOrcado?: boolean;
}

export interface ListarDREsParams {
    ano?: number;
    tipo?: PeriodoDRE;
    pagina?: number;
    limite?: number;
}

export interface BuscarEvolucaoParams {
    ano: number;
}

export interface DREResponse {
    dre: DRE;
    comparativo?: ComparativoDRE;
    geradoEm: string;
}

// ============================================================================
// Validation helpers
// ============================================================================

export function isPeriodoDREValido(tipo: string): tipo is PeriodoDRE {
    return ['mensal', 'trimestral', 'semestral', 'anual'].includes(tipo);
}

export function validarGerarDREDTO(dto: GerarDREDTO): boolean {
    if (!dto.dataInicio || !dto.dataFim) return false;
    if (new Date(dto.dataInicio) > new Date(dto.dataFim)) return false;
    if (dto.tipo && !isPeriodoDREValido(dto.tipo)) return false;
    return true;
}
