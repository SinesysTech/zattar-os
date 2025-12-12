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
    CategoriaDRE
} from '../domain/dre';
import {
    validarGerarDREDTO,
    gerarDescricaoPeriodo,
    calcularPeriodoAnterior,
    calcularMargem,
    calcularEBITDA,
    calcularReceitaLiquida,
    calcularLucroBruto,
    calcularLucroOperacional,
    calcularResultadoFinanceiro,
    calcularLucroLiquido
} from '../domain/dre';

// ============================================================================
// Helpers
// ============================================================================

function calcularPercentuais(categorias: CategoriaDRE[], total: number): CategoriaDRE[] {
    return categorias.map(c => ({
        ...c,
        percentualReceita: calcularMargem(c.valor, total)
    }));
}

// ============================================================================
// Service Implementation
// ============================================================================

export const DREService = {
    /**
     * Calcula DRE para um período
     */
    async calcularDRE(dto: GerarDREDTO): Promise<DRE> {
        // Validar DTO usando regras do domain
        const validacao = validarGerarDREDTO(dto);
        if (!validacao.valido) {
            throw new Error(`DTO inválido: ${validacao.erros.join(', ')}`);
        }

        const { dataInicio, dataFim, tipo } = dto;

        // Buscar dados em paralelo
        const [totais, receitas, despesas] = await Promise.all([
            DRERepository.buscarTotaisPorTipo(dataInicio, dataFim),
            DRERepository.buscarReceitasPorCategoria(dataInicio, dataFim),
            DRERepository.buscarDespesasPorCategoria(dataInicio, dataFim)
        ]);

        const { receitaBruta, despesasOperacionais, custosDiretos } = totais;

        // Calcular valores do DRE usando funções do domain
        const deducoes = 0; // TODO: Implementar deduções quando houver categorias específicas
        const receitaLiquida = calcularReceitaLiquida(receitaBruta, deducoes);
        const lucroBruto = calcularLucroBruto(receitaLiquida, custosDiretos);
        const lucroOperacional = calcularLucroOperacional(lucroBruto, despesasOperacionais);

        // Para simplificar, valores financeiros e impostos são zero por enquanto
        const depreciacaoAmortizacao = 0;
        const ebitda = calcularEBITDA(lucroOperacional, depreciacaoAmortizacao);
        const receitasFinanceiras = 0;
        const despesasFinanceiras = 0;
        const resultadoFinanceiro = calcularResultadoFinanceiro(receitasFinanceiras, despesasFinanceiras);
        const resultadoAntesImposto = lucroOperacional + resultadoFinanceiro;
        const impostos = 0;
        const lucroLiquido = calcularLucroLiquido(resultadoAntesImposto, impostos);

        const resumo: ResumoDRE = {
            receitaBruta,
            deducoes,
            receitaLiquida,
            custosDiretos,
            lucroBruto,
            margemBruta: calcularMargem(lucroBruto, receitaLiquida),
            despesasOperacionais,
            lucroOperacional,
            margemOperacional: calcularMargem(lucroOperacional, receitaLiquida),
            depreciacaoAmortizacao,
            ebitda,
            margemEBITDA: calcularMargem(ebitda, receitaLiquida),
            receitasFinanceiras,
            despesasFinanceiras,
            resultadoFinanceiro,
            resultadoAntesImposto,
            impostos,
            lucroLiquido,
            margemLiquida: calcularMargem(lucroLiquido, receitaLiquida)
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
