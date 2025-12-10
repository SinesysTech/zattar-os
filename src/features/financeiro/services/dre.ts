/**
 * Service de DRE (Demonstração de Resultado do Exercício)
 * Casos de uso e orquestração de regras de negócio
 */

import { DRERepository } from '../repository/dre';
import type {
    DRE,
    ResumoDRE,
    ComparativoDRE,
    EvolucaoDRE,
    GerarDREDTO,
    PeriodoDRE,
    CategoriaDRE
} from '../types/dre';

// ============================================================================
// Helpers
// ============================================================================

const MESES_NOMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function gerarDescricaoPeriodo(dataInicio: string, dataFim: string, tipo?: PeriodoDRE): string {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    if (tipo === 'mensal') {
        return `${MESES_NOMES[inicio.getMonth()]} ${inicio.getFullYear()}`;
    } else if (tipo === 'trimestral') {
        const trimestre = Math.floor(inicio.getMonth() / 3) + 1;
        return `${trimestre}º Trimestre ${inicio.getFullYear()}`;
    } else if (tipo === 'semestral') {
        const semestre = inicio.getMonth() < 6 ? '1º' : '2º';
        return `${semestre} Semestre ${inicio.getFullYear()}`;
    } else {
        return `${inicio.getFullYear()}`;
    }
}

function calcularPercentuais(categorias: CategoriaDRE[], total: number): CategoriaDRE[] {
    return categorias.map(c => ({
        ...c,
        percentualReceita: total > 0 ? (c.valor / total) * 100 : 0
    }));
}

function calcularPeriodoAnterior(dataInicio: string, dataFim: string): { dataInicio: string; dataFim: string } {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    // Calcular diferença em meses
    const mesesDiff = (fim.getFullYear() - inicio.getFullYear()) * 12 +
        (fim.getMonth() - inicio.getMonth()) + 1;

    // Subtrair mesma quantidade de meses
    const novoInicio = new Date(inicio);
    novoInicio.setMonth(novoInicio.getMonth() - mesesDiff);

    const novoFim = new Date(inicio);
    novoFim.setDate(novoFim.getDate() - 1);

    return {
        dataInicio: novoInicio.toISOString().split('T')[0],
        dataFim: novoFim.toISOString().split('T')[0]
    };
}

// ============================================================================
// Service Implementation
// ============================================================================

export const DREService = {
    /**
     * Calcula DRE para um período
     */
    async calcularDRE(dto: GerarDREDTO): Promise<DRE> {
        const { dataInicio, dataFim, tipo } = dto;

        // Buscar dados em paralelo
        const [totais, receitas, despesas] = await Promise.all([
            DRERepository.buscarTotaisPorTipo(dataInicio, dataFim),
            DRERepository.buscarReceitasPorCategoria(dataInicio, dataFim),
            DRERepository.buscarDespesasPorCategoria(dataInicio, dataFim)
        ]);

        const { receitaBruta, despesasOperacionais, custosDiretos } = totais;

        // Calcular valores do DRE
        const deducoes = 0; // TODO: Implementar deduções quando houver categorias específicas
        const receitaLiquida = receitaBruta - deducoes;
        const lucroBruto = receitaLiquida - custosDiretos;
        const lucroOperacional = lucroBruto - despesasOperacionais;

        // Para simplificar, valores financeiros e impostos são zero por enquanto
        const depreciacaoAmortizacao = 0;
        const ebitda = lucroOperacional + depreciacaoAmortizacao;
        const receitasFinanceiras = 0;
        const despesasFinanceiras = 0;
        const resultadoFinanceiro = receitasFinanceiras - despesasFinanceiras;
        const resultadoAntesImposto = lucroOperacional + resultadoFinanceiro;
        const impostos = 0;
        const lucroLiquido = resultadoAntesImposto - impostos;

        const resumo: ResumoDRE = {
            receitaBruta,
            deducoes,
            receitaLiquida,
            custosDiretos,
            lucroBruto,
            margemBruta: receitaLiquida > 0 ? (lucroBruto / receitaLiquida) * 100 : 0,
            despesasOperacionais,
            lucroOperacional,
            margemOperacional: receitaLiquida > 0 ? (lucroOperacional / receitaLiquida) * 100 : 0,
            depreciacaoAmortizacao,
            ebitda,
            margemEBITDA: receitaLiquida > 0 ? (ebitda / receitaLiquida) * 100 : 0,
            receitasFinanceiras,
            despesasFinanceiras,
            resultadoFinanceiro,
            resultadoAntesImposto,
            impostos,
            lucroLiquido,
            margemLiquida: receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0
        };

        return {
            periodo: {
                tipo: tipo || 'anual',
                dataInicio,
                dataFim,
                descricao: gerarDescricaoPeriodo(dataInicio, dataFim, tipo)
            },
            resumo,
            receitasPorCategoria: calcularPercentuais(receitas, receitaLiquida),
            despesasPorCategoria: calcularPercentuais(despesas, receitaLiquida),
            geradoEm: new Date().toISOString()
        };
    },

    /**
     * Calcula DRE com comparativo do período anterior
     */
    async calcularComparativoDRE(dto: GerarDREDTO): Promise<ComparativoDRE> {
        const dreAtual = await this.calcularDRE(dto);

        const result: ComparativoDRE = {
            periodoAtual: dreAtual
        };

        if (dto.incluirComparativo) {
            const periodoAnterior = calcularPeriodoAnterior(dto.dataInicio, dto.dataFim);
            const dreAnterior = await this.calcularDRE({
                dataInicio: periodoAnterior.dataInicio,
                dataFim: periodoAnterior.dataFim,
                tipo: dto.tipo
            });

            result.periodoAnterior = dreAnterior;

            // Calcular variações
            const calcVariacao = (atual: number, anterior: number) =>
                anterior !== 0 ? ((atual - anterior) / Math.abs(anterior)) * 100 : 0;

            result.variacoes = {
                receitaLiquida: calcVariacao(dreAtual.resumo.receitaLiquida, dreAnterior.resumo.receitaLiquida),
                lucroBruto: calcVariacao(dreAtual.resumo.lucroBruto, dreAnterior.resumo.lucroBruto),
                lucroOperacional: calcVariacao(dreAtual.resumo.lucroOperacional, dreAnterior.resumo.lucroOperacional),
                ebitda: calcVariacao(dreAtual.resumo.ebitda, dreAnterior.resumo.ebitda),
                lucroLiquido: calcVariacao(dreAtual.resumo.lucroLiquido, dreAnterior.resumo.lucroLiquido)
            };
        }

        // TODO: Implementar comparativo com orçado quando houver integração

        return result;
    },

    /**
     * Calcula evolução anual do DRE
     */
    async calcularEvolucaoAnual(ano: number): Promise<EvolucaoDRE[]> {
        return DRERepository.buscarEvolucaoMensal(ano);
    }
};

// Exportar funções individuais para compatibilidade
export const calcularDRE = DREService.calcularDRE.bind(DREService);
export const calcularComparativoDRE = DREService.calcularComparativoDRE.bind(DREService);
export const calcularEvolucaoAnual = DREService.calcularEvolucaoAnual.bind(DREService);
